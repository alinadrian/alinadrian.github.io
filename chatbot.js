(() => {
  'use strict';
  const DATA = window.AA_LOCAL_CHATBOT_DATA;
  const SITE_INDEX = window.AA_LOCAL_SITE_INDEX || {};
  if (!DATA || !DATA.knowledge || !DATA.i18n) return;

  const pageLang = ((document.documentElement.lang || 'ro').split('-')[0] || 'ro').toLowerCase();
  const currentLang = DATA.i18n[pageLang] ? pageLang : 'en';
  const ui = DATA.i18n[currentLang] || DATA.i18n.en;
  const isRTL = currentLang === 'ar';
  const storageKey = `aa-local-chatbot-${currentLang}`;
  const liveIndexStorageKey = `aa-local-site-index-${currentLang}-${location.hostname || 'offline'}`;
  let runtimeSiteChunks = (SITE_INDEX[currentLang] || []).map((chunk) => ({...chunk, _source:'site'}));
  const maxMessages = 40;
  let lastContext = null;
  let corpusCache = null;

  const normalize = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'`´]/g, '')
    .replace(/[^\p{L}\p{N}+#.]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const stopWords = new Set(normalize(`
    a ai al ale am are ar ca care ce cu da de din este eu fi fost in la lui ma mai mea meu ne nu o pe pentru sa se si sunt te un una unde poate putea lui despre
    the a an and are as at be by for from has have he her his i in is it of on or she that this to was we what which who with you your does can about
    il lo la i gli le un uno una e ed di da del della dei delle in su per con che chi come cosa e è sono ha hai hanno puo può
    el la los las un una y de del en con por para que quien como cual cuales es son tiene puede
    bir bu ve ile icin için ne kim nasil nasıl hangi var olan ben sen o
    der die das ein eine und von zu mit für ist sind hat haben wer was wie welche kann
    и в во на с со для о об это есть кто что как какой какие имеет может
    le la les un une et de des du en avec pour est sont a ont qui quoi comment quel quels peut
    o a os as um uma e de do da em com para que quem como qual quais tem pode
    في من على عن مع إلى هذا هذه هو هي و ما من كيف أي لديه يستطيع
  `).split(' ').filter(Boolean));

  const rawTokens = (text) => normalize(text).split(' ').filter((token) => token.length > 1);
  const tokenise = (text) => rawTokens(text).filter((token) => !stopWords.has(token));
  const containsTerm = (text, term) => {
    const q = normalize(text);
    const a = normalize(term);
    if (!q || !a) return false;
    const qTokens = q.split(' ');
    const aTokens = a.split(' ');
    if (aTokens.length > 1) return (` ${q} `).includes(` ${a} `);
    if (a.length <= 3) return qTokens.includes(a);
    const stem = a.length >= 5 ? a.slice(0, Math.min(6, a.length)) : a;
    return qTokens.some((token) => token === a || token.startsWith(a) || (a.length >= 5 && token.startsWith(stem)));
  };

  // Search vocabulary
  const concepts = {
    identity: ['alin','alin adrian','alin adrian ivana','cine este','cine e','despre alin','who is','about alin','chi e','chi è','quien es','wer ist','qui est','quem e','quem é','кто','من هو'],
    role: ['programator','developer','dezvoltator','full stack','fullstack','software developer','web developer','programmer','sviluppatore','desarrollador','entwickler','développeur','desenvolvedor','разработчик','مبرمج'],
    skills: ['competente','abilitati','skill','skills','tehnologii','stack','ce stie','la ce se pricepe','ce poate','competenze','abilità','habilidades','beceriler','kompetenzen','навыки','compétences','competencias','مهارات'],
    education: ['studii','studiat','a studiat','educatie','formare','cursuri','absolvit','absolvita','academy','link academy','diploma','training','education','formazione','formacion','ausbildung','egitim','обучение','formation','formacao','تدريب'],
    experience: ['experienta','a lucrat','joburi','munca','cariera','experience','worked','career','esperienza','experiencia','erfahrung','deneyim','опыт','expérience','خبرة'],
    contact: ['contact','contactez','contacta','email','e mail','mail','github','linkedin','mesaj','scrie','contacto','contatto','iletisim','kontakt','контакт','اتصال','تواصل'],
    services: ['servicii','serviciu','colaborare','colaborari','ce poate construi','ce dezvolta','services','service','collaboration','servizi','servicios','dienstleistungen','services','serviços','خدمات'],
    projects: ['proiect','proiecte','portofoliu','project','projects','portfolio','progetto','progetti','proyecto','proyectos','proje','projeler','projekt','projekte','проект','проекты','projet','projets','projeto','projetos','مشروع','مشاريع'],
    learning: ['invata acum','aprofundeaza','studiaza acum','in prezent','learning now','currently learning','approfondisce','aprendiendo','vertieft','öğreniyor','изучает','apprend','aprendendo','يتعلم'],
    backend: ['backend','server','api','rest','http','django','fastapi','orm'],
    frontend: ['frontend','front end','html','css','javascript','js','interfata','interface','ui'],
    database: ['baza de date','baze de date','database','databases','mysql','sql','postgresql','postgres','orm'],
    ai: ['inteligenta artificiala','ai','machine learning','ml','nlp','llm','scipy','artificial intelligence'],
    qa: ['testare','testing','qa','quality assurance','quality control','automatizare','automation'],
    networking: ['networking','retele','retea','sockets','socket','http','soap','xml','web services'],
    design: ['figma','design','ui','css avansat','advanced css','animation','animatie'],
    cnc: ['cnc','programator cnc','desen tehnic','technical drawing'],
    international: ['international','internationala','internationala','logistica','transport persoane','logistics','transport'],
    python: ['python','oop','object oriented','programare orientata pe obiecte','data structures','debugging'],
    javascript: ['javascript','java script','js','html','css','website building'],
    rummy: ['rummy','remi','remi arena','rummy online'],
    expense: ['expense tracker','cheltuieli','venituri','buget','budget','expenses'],
    driver: ['driver jobs','driver jobs hub','sofer','soferi','șofer','șoferi','driver','drivers'],
    website: ['site','website','alinadrian.dev','portofoliu personal','personal portfolio']
  };

  const intentRules = {
    projects: concepts.projects,
    skills: concepts.skills,
    contact: concepts.contact,
    learning: concepts.learning,
    education: concepts.education,
    experience: concepts.experience,
    services: concepts.services,
    about: [...concepts.identity, ...concepts.role]
  };

  const langHints = {
    ro:['cine','ce','care','cum','unde','despre','stie','știe','poate','proiect','proiecte','competente','abilitati','contactez','formare','experienta','studii'],
    en:['who','what','which','how','where','about','does','know','can','project','projects','skills','contact','training','experience','studies'],
    it:['chi','cosa','quale','quali','come','dove','conosce','puo','può','progetti','competenze','contatto','formazione','esperienza'],
    es:['quien','qué','que','cual','como','donde','sabe','conoce','puede','proyectos','habilidades','contacto','formacion','experiencia'],
    tr:['kim','ne','hangi','nasil','nerede','biliyor','yapabilir','projeler','beceriler','iletisim','egitim','deneyim'],
    de:['wer','was','welche','wie','wo','kennt','kann','projekte','kompetenzen','kontakt','ausbildung','erfahrung'],
    ru:['кто','что','какие','как','где','знает','умеет','проекты','навыки','контакт','обучение','опыт'],
    fr:['qui','quoi','quel','quels','comment','où','ou','sait','connait','peut','projets','competences','contact','formation','experience'],
    pt:['quem','que','qual','como','onde','sabe','conhece','pode','projetos','competencias','contato','formacao','experiencia'],
    ar:['من','ما','ماذا','كيف','أين','اين','يعرف','يستطيع','مشاريع','مهارات','اتصال','تدريب','خبرة']
  };

  const technologyTerms = {
    python:['python','oop'], django:['django'], javascript:['javascript','java script','js'], html:['html','html5'], css:['css','css3'],
    mysql:['mysql'], sql:['sql'], orm:['orm'], rest:['rest','restful'], fastapi:['fastapi'], postgresql:['postgresql','postgres'], docker:['docker'],
    figma:['figma'], ml:['machine learning','ml'], nlp:['nlp'], llm:['llm'], qa:['qa','quality assurance','testing','testare'],
    networking:['networking','sockets','socket'], http:['http'], soap:['soap'], xml:['xml'], scipy:['scipy'], deployment:['deployment','deploy'], jwt:['jwt'], cicd:['ci cd','ci/cd']
  };

  const privateFactPatterns = [
    'varsta','vârsta','age','eta','età','edad','alter','возраст','idade','العمر',
    'adresa','address','indirizzo','direccion','dirección','adresse','morada','عنوان',
    'telefon','phone','telefono','téléphone','telefone','номер телефона','هاتف',
    'salariu','salary','stipendio','sueldo','gehalt','salaire','salario','راتب',
    'casatorit','căsătorit','married','sposato','casado','verheiratet','marié','женат','متزوج',
    'familie','family','famiglia','familia','familie','семья','famille','عائلة'
  ].map(normalize);

  const allConceptAliases = Object.values(concepts).flat().map(normalize);
  const scopeAnchors = [
    'alin','adrian','ivana','alinadrian.dev','portofoliu','portfolio','site','website','full stack','developer','programator',
    'python','django','javascript','html','css','mysql','sql','orm','rest','fastapi','postgresql','docker','figma','machine learning','nlp','llm','qa','testing','cnc',
    'rummy','remi','expense tracker','driver jobs','github','linkedin','link academy','backend','frontend','baza de date','baze de date','database','databases'
  ].map(normalize);
  const offTopicPatterns = [
    'vreme','meteo','weather','meteo','tempo oggi','previsioni','clima','wetter','погода','météo','الطقس',
    'fotbal','football','soccer','tenis','tennis','nba','sport','sports','știri','stiri','news','notizie','noticias','nachrichten','новости','actualites','actualité',
    'bitcoin','crypto','criptomonede','alegeri','election','politica','politics','recipe','reteta','rețeta','film','movie','muzica','music'
  ].map(normalize);


  const detectLanguage = (question) => {
    const q = normalize(question);
    const qWords = q.split(' ');
    const strictHint = (hint) => {
      const h = normalize(hint);
      if (!h) return false;
      return h.includes(' ') ? (` ${q} `).includes(` ${h} `) : qWords.includes(h);
    };
    let best = currentLang, bestScore = 0;
    Object.entries(langHints).forEach(([lang, hints]) => {
      const score = hints.reduce((sum, hint) => sum + (strictHint(hint) ? 1 : 0), 0);
      if (score > bestScore) { bestScore = score; best = lang; }
    });
    return bestScore ? best : currentLang;
  };

  const matchConcepts = (question) => {
    const q = normalize(question);
    const hits = [];
    Object.entries(concepts).forEach(([concept, aliases]) => {
      let score = 0;
      aliases.forEach((alias) => {
        const a = normalize(alias);
        if (!a) return;
        if (q === a) score += 7;
        else if (containsTerm(q, a)) score += a.includes(' ') ? 5 : 3;
      });
      if (score) hits.push({concept, score});
    });
    return hits.sort((a,b) => b.score - a.score);
  };

  const detectIntent = (question) => {
    const q = normalize(question);
    let winner = null, high = 0;
    Object.entries(intentRules).forEach(([intent, patterns]) => {
      let score = 0;
      patterns.forEach((p) => {
        const np = normalize(p);
        if (np && containsTerm(q, np)) score += np.includes(' ') ? 4 : 2;
      });
      if (score > high) { high = score; winner = intent; }
    });
    return winner;
  };

  const isShortFollowUp = (question) => {
    const q = normalize(question);
    const starters = ['dar','si','și','iar','despre','and','also','what about','e','anche','y','tambien','también','und','auch','et','aussi','tambem','também','а','и','لكن','و'];
    return !!lastContext && starters.some((s) => q === normalize(s) || q.startsWith(`${normalize(s)} `));
  };

  const siteChunksFor = (lang) => lang === currentLang
    ? runtimeSiteChunks
    : (SITE_INDEX[lang] || []).map((chunk) => ({...chunk, _source:'site'}));

  // Search scope
  const siteScopeScore = (question, lang = currentLang) => {
    const tokens = tokenise(question).filter((t) => !['alin','adrian','ivana','site','website'].includes(t));
    if (!tokens.length) return 0;
    let best = 0;
    siteChunksFor(lang).forEach((chunk) => {
      const hay = normalize(`${chunk.title || ''} ${chunk.text || ''}`);
      const words = hay.split(' ');
      let score = 0;
      tokens.forEach((token) => {
        if (words.includes(token)) score += 4;
        else if (hay.includes(token)) score += 2;
        else if (token.length >= 4 && words.some((word) => prefixMatch(word, token))) score += 1.4;
        else if (token.length >= 5 && words.slice(0,220).some((word) => tokenSimilarity(word, token) >= .76)) score += 1.15;
      });
      if (tokens.length > 1 && tokens.every((token) => hay.includes(token) || words.some((word) => prefixMatch(word, token)))) score += 3;
      best = Math.max(best, score);
    });
    return best;
  };

  const isInScope = (question) => {
    const q = normalize(question);
    if (offTopicPatterns.some((term) => containsTerm(q, term))) return false;
    if (scopeAnchors.some((term) => containsTerm(q, term))) return true;
    const qTokens = tokenise(q);
    const anchorTokens = scopeAnchors.flatMap((term) => normalize(term).split(' ')).filter((token) => token.length >= 5);
    if (qTokens.some((token) => token.length >= 5 && anchorTokens.some((anchor) => tokenSimilarity(token, anchor) >= .78))) return true;
    const intent = detectIntent(question);
    if (intent && intent !== 'about') return true;
    if (intent === 'about') {
      return ['alin','adrian','ivana'].some((name) => containsTerm(q, name)) ||
        concepts.role.some((term) => containsTerm(q, term)) || isShortFollowUp(question);
    }
    if (siteScopeScore(question, currentLang) >= 6) return true;
    return isShortFollowUp(question);
  };

  const shorten = (text, limit = 620) => {
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    if (value.length <= limit) return value;
    const cut = value.slice(0, limit);
    const sentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    return (sentence > limit * .55 ? cut.slice(0, sentence + 1) : cut.replace(/\s+\S*$/, '')) + '…';
  };

  const prefixMatch = (a, b) => {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.length < 4 || b.length < 4) return false;
    return a.startsWith(b) || b.startsWith(a);
  };


  const editDistance = (a, b) => {
    a = String(a || ''); b = String(b || '');
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const prev = Array.from({length:b.length + 1}, (_, i) => i);
    const curr = new Array(b.length + 1);
    for (let i = 1; i <= a.length; i += 1) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
    }
    return prev[b.length];
  };

  const tokenSimilarity = (a, b) => {
    a = normalize(a); b = normalize(b);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (prefixMatch(a,b)) return .9;
    if (Math.abs(a.length - b.length) > 3 || Math.max(a.length,b.length) > 26) return 0;
    const distance = editDistance(a,b);
    return 1 - (distance / Math.max(a.length,b.length));
  };

  const sentenceSplit = (text) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    const parts = clean.replace(/([.!?。！？])\s+/gu, '$1\u0000').split('\u0000');
    return parts.map((x) => x.trim()).filter((x) => x.length >= 18);
  };

  const buildCorpusStats = (lang) => {
    const chunks = searchableChunks(lang);
    if (corpusCache && corpusCache.lang === lang && corpusCache.count === chunks.length && corpusCache.siteRef === runtimeSiteChunks) return corpusCache;
    const df = new Map();
    const vocabulary = new Map();
    let totalLength = 0;
    const docs = chunks.map((chunk) => {
      const tokens = tokenise(chunkSearchText(chunk));
      totalLength += tokens.length;
      const tf = new Map();
      tokens.forEach((token) => {
        tf.set(token, (tf.get(token) || 0) + 1);
        vocabulary.set(token, (vocabulary.get(token) || 0) + 1);
      });
      new Set(tokens).forEach((token) => df.set(token, (df.get(token) || 0) + 1));
      return {chunk, tf, length:Math.max(1,tokens.length)};
    });
    corpusCache = {
      lang, count:chunks.length, siteRef:runtimeSiteChunks, docs, df, vocabulary,
      avgLength: Math.max(1, totalLength / Math.max(1, docs.length)),
      total: Math.max(1, docs.length)
    };
    return corpusCache;
  };

  const fuzzyCorrectTokens = (tokens, lang) => {
    const stats = buildCorpusStats(lang);
    const vocabulary = [...stats.vocabulary.keys()];
    return tokens.map((token) => {
      if (stats.vocabulary.has(token) || token.length < 4) return token;
      let best = token, bestScore = 0;
      for (const candidate of vocabulary) {
        if (Math.abs(candidate.length - token.length) > 2) continue;
        if (candidate[0] !== token[0] && token.length < 7) continue;
        const sim = tokenSimilarity(token, candidate);
        if (sim > bestScore) { bestScore = sim; best = candidate; }
      }
      return bestScore >= (token.length <= 5 ? .78 : .72) ? best : token;
    });
  };

  const bm25Score = (chunk, queryTokens, lang) => {
    const stats = buildCorpusStats(lang);
    const entry = stats.docs.find((doc) => doc.chunk === chunk || (doc.chunk.title === chunk.title && doc.chunk.text === chunk.text));
    if (!entry) return 0;
    const k1 = 1.35, b = .72;
    let score = 0;
    [...new Set(queryTokens)].forEach((token) => {
      const freq = entry.tf.get(token) || 0;
      if (!freq) return;
      const n = stats.df.get(token) || 0;
      const idf = Math.log(1 + (stats.total - n + .5) / (n + .5));
      const denom = freq + k1 * (1 - b + b * entry.length / stats.avgLength);
      score += idf * (freq * (k1 + 1) / denom);
    });
    return score;
  };

  const multiSourceAnswer = (ranked, queryTokens, lang) => {
    if (!ranked.length) return null;
    const top = ranked[0].score;
    const candidates = ranked.slice(0,6).filter((item) => item.score >= Math.max(10, top * .58));
    const scored = [];
    candidates.forEach((item, rank) => {
      sentenceSplit(item.chunk.text).forEach((sentence) => {
        const norm = normalize(sentence);
        const words = norm.split(' ');
        let score = Math.max(0, 4 - rank) + item.score * .04;
        queryTokens.forEach((token) => {
          if (words.includes(token)) score += 3.2;
          else if (words.some((w) => prefixMatch(w,token))) score += 1.8;
          else if (token.length >= 5 && words.slice(0,90).some((w) => tokenSimilarity(w,token) >= .78)) score += .9;
        });
        scored.push({sentence, norm, score, chunk:item.chunk});
      });
    });
    scored.sort((a,b) => b.score - a.score);
    const picked = [], seen = [];
    for (const item of scored) {
      if (picked.length >= 3) break;
      if (seen.some((s) => s === item.norm || (s.length > 45 && item.norm.includes(s)) || (item.norm.length > 45 && s.includes(item.norm)))) continue;
      picked.push(item); seen.push(item.norm);
    }
    if (!picked.length) return null;
    const text = shorten(picked.map((x) => x.sentence).join(' '), 760);
    const sources = [];
    picked.forEach((x) => {
      if (x.chunk?.url && !sources.some((s) => s.url === x.chunk.url)) sources.push(x.chunk);
    });
    return {text, sources:sources.slice(0,3)};
  };

  const extraUI = {
    ro:{help:'Pot răspunde despre profilul profesional al lui Alin, competențe, proiecte, experiență, studii, servicii și contact. Caut local în conținutul public al site-ului, inclusiv cu toleranță la greșeli de tastare și întrebări de continuare. Nu folosesc API AI extern și nu inventez date nepublicate.'},
    en:{help:'I can answer about Alin’s professional profile, skills, projects, experience, education, services and contact options. I search the public website locally, including typo-tolerant and follow-up queries. I use no external AI API and do not invent unpublished facts.'},
    it:{help:'Posso rispondere sul profilo professionale di Alin, competenze, progetti, esperienza, formazione, servizi e contatti. Cerco localmente nei contenuti pubblici del sito, anche con errori di digitazione e domande successive. Non uso API AI esterne e non invento dati non pubblicati.'},
    es:{help:'Puedo responder sobre el perfil profesional de Alin, habilidades, proyectos, experiencia, formación, servicios y contacto. Busco localmente en el contenido público del sitio, incluso con errores de escritura y preguntas de seguimiento. No uso una API de IA externa ni invento datos no publicados.'},
    tr:{help:'Alin’in profesyonel profili, becerileri, projeleri, deneyimi, eğitimi, hizmetleri ve iletişim seçenekleri hakkında yanıt verebilirim. Yazım hatalarına ve takip sorularına toleranslı olarak sitenin herkese açık içeriğinde yerel arama yaparım. Harici AI API kullanmam ve yayımlanmamış bilgi uydurmam.'},
    de:{help:'Ich kann Fragen zu Alins beruflichem Profil, Kompetenzen, Projekten, Erfahrung, Ausbildung, Leistungen und Kontakt beantworten. Ich durchsuche die öffentlichen Website-Inhalte lokal, auch fehlertolerant und mit Folgefragen. Ich nutze keine externe KI-API und erfinde keine unveröffentlichten Angaben.'},
    ru:{help:'Я могу отвечать о профессиональном профиле Алина, навыках, проектах, опыте, обучении, услугах и контактах. Поиск выполняется локально по публичному содержимому сайта, с учётом опечаток и уточняющих вопросов. Внешний AI API не используется, непубличные данные не выдумываются.'},
    fr:{help:'Je peux répondre sur le profil professionnel d’Alin, ses compétences, projets, expérience, formation, services et moyens de contact. La recherche se fait localement dans le contenu public du site, avec tolérance aux fautes et aux questions de suivi. Aucune API IA externe n’est utilisée et je n’invente pas d’informations non publiées.'},
    pt:{help:'Posso responder sobre o perfil profissional de Alin, competências, projetos, experiência, formação, serviços e contacto. Pesquiso localmente no conteúdo público do site, com tolerância a erros de digitação e perguntas de seguimento. Não uso API externa de IA nem invento dados não publicados.'},
    ar:{help:'يمكنني الإجابة عن الملف المهني لألين ومهاراته ومشاريعه وخبرته وتدريبه وخدماته ووسائل التواصل. يتم البحث محليًا داخل المحتوى العام للموقع مع تحمّل أخطاء الكتابة والأسئلة المتتابعة. لا أستخدم واجهة ذكاء اصطناعي خارجية ولا أختلق معلومات غير منشورة.'}
  };

  const greetingTerms = ['salut','buna','bună','hello','hi','hey','ciao','hola','merhaba','hallo','bonjour','olá','ola','привет','здравствуйте','مرحبا','أهلا'];
  const helpTerms = ['ce poti face','ce poți face','cum ma poti ajuta','what can you do','how can you help','cosa puoi fare','come puoi aiutarmi','que puedes hacer','qué puedes hacer','ne yapabilirsin','was kannst du','что ты умеешь','que peux tu faire','o que podes fazer','ماذا يمكنك أن تفعل'];
  const isGreeting = (q) => greetingTerms.some((term) => normalize(q) === normalize(term) || normalize(q).startsWith(`${normalize(term)} `));
  const asksHelp = (q) => helpTerms.some((term) => containsTerm(q, term));

  const allChunks = Object.entries(DATA.knowledge).flatMap(([lang, chunks]) => chunks.map((chunk) => ({...chunk, lang, _source:'curated'})));

  const chunkSearchText = (chunk) => normalize(`${chunk.title || ''} ${chunk.text || ''} ${chunk.route || ''} ${chunk.kind || ''}`);

  const scoreChunk = (chunk, queryTokens, queryNorm, intent, preferredLang, conceptHits) => {
    const title = normalize(chunk.title);
    const text = normalize(chunk.text);
    const haystack = `${title} ${text}`;
    const words = new Set(haystack.split(' '));
    let score = chunk.lang === preferredLang ? 4.5 : -2;
    if (chunk._source === 'curated') score += 2.2;
    if (chunk._source === 'site') score += .6;
    score += bm25Score(chunk, queryTokens, preferredLang) * 2.4;

    const qCore = tokenise(queryNorm).filter((t) => !['alin','adrian','ivana'].includes(t));
    if (queryNorm.length >= 8 && title && (` ${title} `).includes(` ${queryNorm} `)) score += 28;
    else if (qCore.length >= 2 && title) {
      const titleWords = title.split(' ');
      const matchedTitleTerms = qCore.filter((t) => title.includes(t) || titleWords.some((w) => prefixMatch(w,t))).length;
      if (matchedTitleTerms === qCore.length) score += 34;
      else if (matchedTitleTerms >= 2 && matchedTitleTerms / qCore.length >= .6) score += 22;
    }

    queryTokens.forEach((token) => {
      const isNameToken = ['alin','adrian','ivana'].includes(token);
      if (title.split(' ').includes(token)) score += isNameToken ? 1 : 9;
      else if (title.includes(token)) score += isNameToken ? .5 : 5;
      if (words.has(token)) score += isNameToken ? .6 : 5;
      else if (text.includes(token)) score += isNameToken ? .25 : 2;
      else if (!isNameToken && [...words].some((word) => prefixMatch(word, token))) score += 1.6;
    });


    if (intent && chunk.route === intent) score += 10;
    if (intent === 'about' && (chunk.kind === 'profile' || chunk.route === 'about')) score += 12;
    if (intent === 'learning' && chunk.kind === 'learning') score += 13;
    if (intent === 'contact' && chunk.kind === 'contact') score += 14;
    if (intent === 'skills' && chunk.kind === 'skill') score += 10;
    if (intent === 'projects' && chunk.kind === 'project') score += 10;
    if (intent === 'education' && chunk.route === 'about') score += 8;
    if (intent === 'experience' && chunk.route === 'about' && ['experience','service','profile'].includes(chunk.kind)) score += 8;
    if (intent === 'services' && ['service','contact'].includes(chunk.kind)) score += 9;

    if (lastContext && isShortFollowUp(queryNorm)) {
      if (chunk.route === lastContext.route) score += 2.5;
    }
    return score;
  };

  const localizedChunks = (lang) => (DATA.knowledge[lang] || DATA.knowledge[currentLang] || DATA.knowledge.en || []).map((chunk) => ({...chunk, lang, _source:'curated'}));
  const searchableChunks = (lang) => [...localizedChunks(lang), ...siteChunksFor(lang)];

  const aggregateIntent = (intent, lang) => {
    const chunks = localizedChunks(lang);
    let selected = [];
    let limit = 5;
    let itemLimit = 210;
    if (intent === 'projects') selected = chunks.filter((c) => c.kind === 'project' && c.route === 'projects');
    if (intent === 'skills') { selected = chunks.filter((c) => c.kind === 'skill' && c.route === 'skills'); limit = 8; itemLimit = 130; }
    if (intent === 'experience') { selected = chunks.filter((c) => c.route === 'about' && c.kind === 'service' && ['cnc','experien','comunic','international','internation','logistic','transport','supervisor','call center'].some((term) => containsTerm(`${c.title} ${c.text}`, term))); limit = 5; itemLimit = 190; }
    if (intent === 'services') { selected = chunks.filter((c) => c.kind === 'service' && (c.route === 'contact' || c.route === 'home')); limit = 4; itemLimit = 170; }
    if (!selected.length) return null;
    const seen = new Set();
    selected = selected.filter((c) => {
      const key = normalize(c.title);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    const items = selected.slice(0, limit).map((c) => `• ${shorten(c.text, itemLimit)}`).join('\n');
    return { text: items, source: selected[0] };
  };

  const specificTechnologyAsked = (question) => {
    const q = normalize(question);
    return Object.entries(technologyTerms)
      .filter(([,aliases]) => aliases.some((a) => containsTerm(q, a)))
      .map(([tech]) => tech);
  };

  const findPublishedTechnology = (techs, lang) => {
    if (!techs.length) return null;
    const chunks = searchableChunks(lang);
    const aliases = techs.flatMap((t) => technologyTerms[t] || []);
    const ranked = chunks
      .map((chunk) => {
        const hay = chunkSearchText(chunk);
        const matches = aliases.filter((a) => containsTerm(hay, a)).length;
        return {chunk, matches};
      })
      .filter((x) => x.matches > 0)
      .sort((a,b) => b.matches - a.matches || (a.chunk.kind === 'skill' ? -1 : 1));
    return ranked[0]?.chunk || null;
  };

  const asksPrivateFact = (question) => {
    const q = normalize(question);
    return privateFactPatterns.some((p) => containsTerm(q, p));
  };

  const responseWithSources = (text, sources, lang, keywords = []) => {
    const list = (Array.isArray(sources) ? sources : [sources]).filter(Boolean);
    const source = list[0] || null;
    if (source) lastContext = {route:source.route, kind:source.kind, title:source.title, lang, keywords:[...new Set(keywords)].slice(0,8)};
    return {text, source, sources:list.slice(0,3), lang};
  };
  const responseWithSource = (text, source, lang, keywords = []) => responseWithSources(text, source ? [source] : [], lang, keywords);

  // Answer selection
  const answerQuestion = (question) => {
    const preferredLang = currentLang;
    const responseUI = DATA.i18n[preferredLang] || ui;
    const qNorm = normalize(question);

    if (isGreeting(question)) return { text: responseUI.welcome, lang: preferredLang };
    if (asksHelp(question)) return { text: (extraUI[preferredLang] || extraUI.en).help, lang: preferredLang };

    if (!isInScope(question)) return { text: responseUI.out, lang: preferredLang };
    if (asksPrivateFact(question)) return { text: responseUI.unknown, lang: preferredLang };

    const intent = detectIntent(question);
    const conceptHits = matchConcepts(question);
    const techs = specificTechnologyAsked(question);

    if (techs.length && intent !== 'learning') {
      const techChunk = findPublishedTechnology(techs, preferredLang);
      if (techChunk) return responseWithSource(`${responseUI.intro}\n${shorten(techChunk.text)}`, techChunk, preferredLang);
      return { text: responseUI.unknown, lang: preferredLang };
    }

    if (intent === 'about') {
      const chunks = localizedChunks(preferredLang);
      const profile = chunks.find((c) => c.route === 'about' && c.kind === 'profile' && containsTerm(c.title, 'Alin')) ||
        chunks.find((c) => c.route === 'about' && c.kind === 'summary') ||
        chunks.find((c) => c.route === 'about' && c.kind === 'profile');
      if (profile) return responseWithSource(`${responseUI.intro}\n${shorten(profile.text)}`, profile, preferredLang);
    }

    if (intent === 'education') {
      const chunks = localizedChunks(preferredLang);
      const edu = chunks.find((c) => c.route === 'about' && containsTerm(c.text, 'LINK Academy')) ||
        chunks.find((c) => c.route === 'about' && c.kind === 'profile');
      if (edu) return responseWithSource(`${responseUI.intro}\n${shorten(edu.text)}`, edu, preferredLang);
    }

    if (['projects','skills','experience','services'].includes(intent)) {
      const aggregate = aggregateIntent(intent, preferredLang);
      const specificConcepts = conceptHits.filter((x) => ![intent,'identity','role'].includes(x.concept));
      if (aggregate && !specificConcepts.length) {
        return responseWithSource(`${responseUI.intro}\n${aggregate.text}`, aggregate.source, preferredLang);
      }
    }

    const tokens = tokenise(question);
    const correctedTokens = fuzzyCorrectTokens(tokens, preferredLang);
    const enrichedTokens = new Set([...tokens, ...correctedTokens]);
    conceptHits.slice(0,4).forEach(({concept}) => {
      (concepts[concept] || []).slice(0,8).forEach((alias) => tokenise(alias).forEach((t) => enrichedTokens.add(t)));
    });

    if (isShortFollowUp(question) && lastContext) {
      enrichedTokens.add(normalize(lastContext.route));
      (lastContext.keywords || []).slice(0,5).forEach((token) => enrichedTokens.add(token));
    }

    const queryTokens = [...enrichedTokens];
    const ranked = searchableChunks(preferredLang).map((chunk) => ({...chunk, lang: preferredLang}))
      .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTokens, qNorm, intent, preferredLang, conceptHits) }))
      .sort((a,b) => b.score - a.score);

    const best = ranked[0];
    const second = ranked[1];
    const minScore = queryTokens.length <= 1 ? 9 : 12;
    if (!best || best.score < minScore) return { text: responseUI.unknown, lang: preferredLang };

    const informative = tokens.filter((t) => !['alin','adrian','ivana'].includes(t));
    const bestText = chunkSearchText(best.chunk);
    const evidenceTokens = [...new Set([...informative, ...correctedTokens.filter((t) => !['alin','adrian','ivana'].includes(t))])];
    const evidence = evidenceTokens.filter((token) => bestText.includes(token) || bestText.split(' ').some((word) => prefixMatch(word, token) || (token.length >= 5 && tokenSimilarity(word, token) >= .76)));
    const hasIntentEvidence = !!intent || conceptHits.some((h) => h.concept !== 'identity');
    if (informative.length && evidence.length === 0 && !hasIntentEvidence) return { text: responseUI.unknown, lang: preferredLang };

    if (!intent && !conceptHits.length && second && best.score - second.score < .8 && best.score < 18) {
      return { text: responseUI.unknown, lang: preferredLang };
    }

    const synthesis = (queryTokens.length >= 3 || conceptHits.length >= 2) ? multiSourceAnswer(ranked, queryTokens, preferredLang) : null;
    if (synthesis && synthesis.text && synthesis.text.length >= 45) {
      return responseWithSources(`${responseUI.intro}\n${synthesis.text}`, synthesis.sources.length ? synthesis.sources : [best.chunk], preferredLang, queryTokens);
    }
    return responseWithSource(`${responseUI.intro}\n${shorten(best.chunk.text)}`, best.chunk, preferredLang, queryTokens);
  };

  const extractLiveChunks = (html, path, pageMeta = {}) => {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const main = doc.querySelector('main');
      if (!main) return [];
      main.querySelectorAll('script,style,noscript,svg').forEach((el) => el.remove());
      const page = (doc.querySelector('title')?.textContent || pageMeta.page || path).replace(/\s+/g,' ').trim();
      const route = pageMeta.route || 'site';
      const blocks = [];
      const seen = new Set();
      main.querySelectorAll('section,article').forEach((container) => {
        const heading = (container.querySelector('h1,h2,h3,h4')?.textContent || page).replace(/\s+/g,' ').trim();
        const bits = [...container.querySelectorAll('p,li,.contact-phone-label')].map((el) => el.textContent.replace(/\s+/g,' ').trim()).filter((t) => t.length >= 20);
        if (!bits.length) {
          const text = container.textContent.replace(/\s+/g,' ').trim();
          if (text.length >= 40) bits.push(text);
        }
        let buffer = '';
        const flush = () => {
          const text = buffer.trim(); buffer = '';
          if (!text || seen.has(text)) return;
          seen.add(text);
          blocks.push({title:heading,text:shorten(text,760),page,url:path,path,route,kind:'site',lang:currentLang,_source:'site'});
        };
        bits.forEach((bit) => {
          if (buffer && buffer.length + bit.length > 650) flush();
          buffer += `${buffer ? ' ' : ''}${bit}`;
        });
        flush();
      });
      return blocks;
    } catch (_) { return []; }
  };

  const refreshSiteIndexFromPublishedPages = async () => {
    if (!/^https?:$/.test(location.protocol) || typeof fetch !== 'function') return;
    try {
      const cached = JSON.parse(sessionStorage.getItem(liveIndexStorageKey) || 'null');
      if (cached && Array.isArray(cached.chunks) && Date.now() - Number(cached.savedAt || 0) < 30 * 60 * 1000) {
        runtimeSiteChunks = cached.chunks.map((c) => ({...c,_source:'site'}));
        corpusCache = null;
        return;
      }
    } catch (_) {}

    const base = SITE_INDEX[currentLang] || [];
    const pages = [];
    const seen = new Set();
    const addPage = (path, page = path, route = 'site') => {
      if (!path || seen.has(path) || !path.endsWith('/') && !/\.html$/i.test(path)) return;
      seen.add(path);
      pages.push({path,page,route});
    };
    base.forEach((chunk) => addPage(chunk.path || chunk.url, chunk.page, chunk.route));

    try {
      const sitemapResponse = await fetch(new URL('/sitemap.xml', location.origin).href, {credentials:'same-origin',cache:'no-cache'});
      if (sitemapResponse.ok) {
        const xml = new DOMParser().parseFromString(await sitemapResponse.text(), 'application/xml');
        const languagePrefixes = ['en','it','es','tr','de','ru','fr','pt','ar'];
        [...xml.querySelectorAll('loc')].forEach((node) => {
          try {
            const u = new URL(node.textContent.trim(), location.origin);
            const path = u.pathname || '/';
            const first = path.split('/').filter(Boolean)[0] || '';
            const sameLanguage = currentLang === 'ro' ? !languagePrefixes.includes(first) : first === currentLang;
            if (sameLanguage) addPage(path);
          } catch (_) {}
        });
      }
    } catch (_) {}

    if (!pages.length) return;

    const responses = await Promise.allSettled(pages.map(async (meta) => {
      const target = new URL(meta.path, location.origin);
      if (target.origin !== location.origin) return [];
      const response = await fetch(target.href, {credentials:'same-origin',cache:'no-cache'});
      if (!response.ok) return [];
      return extractLiveChunks(await response.text(), meta.path, meta);
    }));
    const live = responses.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
    if (live.length >= Math.max(5, Math.floor(base.length * .2))) {
      runtimeSiteChunks = live;
      corpusCache = null;
      try { sessionStorage.setItem(liveIndexStorageKey, JSON.stringify({savedAt:Date.now(),chunks:live})); } catch (_) {}
    }
  };

  refreshSiteIndexFromPublishedPages();

  const create = (tag, className, attrs = {}) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    Object.entries(attrs).forEach(([name, value]) => {
      if (name === 'text') el.textContent = value;
      else el.setAttribute(name, value);
    });
    return el;
  };

  const root = create('div','aa-chatbot-root');
  root.dir = isRTL ? 'rtl' : 'ltr';

  const launcher = create('button','aa-chatbot-launcher',{
    type:'button','aria-label':ui.title,'aria-expanded':'false','aria-controls':'aa-chatbot-panel'
  });
  launcher.innerHTML = '<span class="aa-chatbot-launcher-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M4 5.8A2.8 2.8 0 0 1 6.8 3h10.4A2.8 2.8 0 0 1 20 5.8v7.4a2.8 2.8 0 0 1-2.8 2.8H11l-4.6 3.7c-.6.5-1.4 0-1.3-.8l.5-2.9A2.8 2.8 0 0 1 4 13.2V5.8Z"/><path d="M8 8h8M8 11.5h5.5" class="aa-chatbot-svg-lines"/></svg></span><span class="aa-chatbot-launcher-dot" aria-hidden="true"></span>';

  const panel = create('section','aa-chatbot-panel',{'id':'aa-chatbot-panel','aria-label':ui.title,'aria-hidden':'true'});
  const header = create('header','aa-chatbot-header');
  const identity = create('div','aa-chatbot-identity');
  const avatar = create('div','aa-chatbot-avatar',{'aria-hidden':'true','text':'AAI'});
  const headingWrap = create('div','aa-chatbot-heading');
  const title = create('strong','',{'text':ui.title});
  const scope = create('span','',{'text':ui.scope});
  headingWrap.append(title, scope);
  identity.append(avatar, headingWrap);
  const headerActions = create('div','aa-chatbot-header-actions');
  const resetBtn = create('button','aa-chatbot-icon-btn',{type:'button','aria-label':ui.reset,title:ui.reset});
  resetBtn.innerHTML = '<span aria-hidden="true">↻</span>';
  const closeBtn = create('button','aa-chatbot-icon-btn',{type:'button','aria-label':ui.close,title:ui.close});
  closeBtn.innerHTML = '<span aria-hidden="true">×</span>';
  headerActions.append(resetBtn, closeBtn);
  header.append(identity, headerActions);

  const messages = create('div','aa-chatbot-messages',{'role':'log','aria-live':'polite','aria-relevant':'additions'});

  const form = create('form','aa-chatbot-form');
  const input = create('input','aa-chatbot-input',{type:'text',placeholder:ui.placeholder,autocomplete:'off','aria-label':ui.placeholder,maxlength:'240'});
  const send = create('button','aa-chatbot-send',{type:'submit','aria-label':ui.send,title:ui.send});
  send.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8-3-8Zm3.6 7h8.1L6.8 6.8 7.6 11Zm-.8 6.2 8.9-4.2H7.6l-.8 4.2Z"/></svg>';
  form.append(input, send);
  panel.append(header, messages, form);
  root.append(panel, launcher);
  document.body.appendChild(root);

  let history = [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) history = saved.slice(-maxMessages);
  } catch (_) { history = []; }

  const saveHistory = () => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(history.slice(-maxMessages))); } catch (_) {}
  };

  const addMessage = (role, text, source = null, persist = true) => {
    const item = create('div',`aa-chatbot-message aa-chatbot-message-${role}`);
    const bubble = create('div','aa-chatbot-bubble');
    const content = create('div','aa-chatbot-text',{'text':text});
    bubble.appendChild(content);
    const sourceList = (Array.isArray(source) ? source : (source ? [source] : []))
      .filter((s, index, arr) => s && s.url && arr.findIndex((x) => x?.url === s.url) === index)
      .slice(0,3);
    sourceList.forEach((entry) => {
      const sourceLink = create('a','aa-chatbot-source',{href:entry.url});
      const sourceUI = DATA.i18n[entry.lang || currentLang] || ui;
      sourceLink.textContent = `${sourceUI.source}: ${entry.page || entry.title || entry.url}`;
      bubble.appendChild(sourceLink);
    });
    item.appendChild(bubble);
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    if (persist) {
      history.push({role,text,source:sourceList.map((s) => ({url:s.url,page:s.page,title:s.title,lang:s.lang}))});
      history = history.slice(-maxMessages);
      saveHistory();
    }
  };

  if (history.length) {
    history.forEach((m) => addMessage(m.role, m.text, m.source, false));
  } else {
    addMessage('assistant', ui.welcome, null, true);
  }

  function submit(raw) {
    const question = String(raw || input.value || '').trim();
    if (!question) return;
    addMessage('user', question);
    input.value = '';
    input.disabled = true;
    send.disabled = true;
    window.setTimeout(() => {
      const result = answerQuestion(question);
      const source = (result.sources || (result.source ? [result.source] : [])).map((item) => ({...item, lang: result.lang}));
      addMessage('assistant', result.text, source);
      input.disabled = false;
      send.disabled = false;
      input.focus();
    }, 180);
  }

  const setOpen = (open) => {
    panel.classList.toggle('open', open);
    launcher.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    launcher.setAttribute('aria-expanded', String(open));
    if (open) window.setTimeout(() => input.focus(), 60);
  };

  launcher.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
  closeBtn.addEventListener('click', () => setOpen(false));
  resetBtn.addEventListener('click', () => {
    history = [];
    saveHistory();
    messages.textContent = '';
    addMessage('assistant', ui.welcome, null, true);
    input.focus();
  });
  form.addEventListener('submit', (event) => { event.preventDefault(); submit(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('open')) setOpen(false);
  });
})();
