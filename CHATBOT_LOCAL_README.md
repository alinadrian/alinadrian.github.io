# Chatbot local pentru AlinAdrian.dev

Versiune: 7.0.0

## Ce face
- rulează 100% în browser;
- cost API: 0 EUR;
- nu folosește OpenAI API, Ollama, server AI sau servicii externe;
- răspunde numai din informațiile publicate în paginile site-ului;
- refuză întrebările fără legătură cu Alin Adrian Ivana sau site-ul;
- funcționează în cele 10 limbi ale site-ului;
- păstrează conversația doar în `sessionStorage` pe dispozitivul vizitatorului;
- include link către pagina-sursă pentru răspunsurile găsite.

## Ce s-a îmbunătățit în v2
Motorul nu mai depinde de câteva întrebări scrise exact. Înțelege local numeroase formulări și sinonime pentru aceleași teme.

Familii de întrebări recunoscute:
- cine este Alin / ce rol profesional are;
- competențe și tehnologii;
- Python, Django, JavaScript, HTML/CSS, MySQL, SQL, REST, ORM;
- AI, Machine Learning, NLP, LLM, QA, networking și Figma;
- studii și formare la LINK Academy;
- experiență profesională, CNC, comunicare și experiență internațională;
- proiecte și stadiul lor: portofoliu, Rummy Online, Expense Tracker, Driver Jobs Hub;
- servicii și tipuri de colaborări;
- contact, email, GitHub și LinkedIn;
- tehnologii aprofundate în prezent: FastAPI, PostgreSQL, Docker și deployment;
- întrebări de continuare de tipul „Dar Django?” sau „Și FastAPI?”.

Pentru tehnologiile numite explicit, chatbotul răspunde numai dacă tehnologia apare în conținutul public al site-ului. Pentru date private sau informații nepublicate, răspunde că informația nu este disponibilă.

## Fișiere
- `chatbot.css` — interfața chatbotului;
- `chatbot.js` — motorul local de căutare, intenții, sinonime și UI;
- `chatbot-data.js` — baza de cunoștințe extrasă din conținutul public al site-ului.

## Important
`chatbot-data.js` rămâne baza curată pentru răspunsurile principale. În v6, `chatbot-site-index.js` adaugă căutare în întregul site, iar pe site-ul public conținutul aceleiași limbi este reîmprospătat local în browser din paginile publice.


## UI v3
- Eliminated the LOCAL / 0 API status strip from the visible interface.
- Eliminated predefined question chips.
- Visitors type their own questions about Alin or the website.
- The AAI header, local-assistant title, subtitle and opening welcome message remain.


## v4 – sincronizare limbă
- Mesajele și răspunsurile chatbotului urmează întotdeauna limba selectată pe site.
- Istoricul sesiunii este separat pe limbă, astfel încât un mesaj românesc nu mai apare după trecerea pe italiană sau pe altă limbă.
- Sunt suportate toate limbile existente pe site: ro, en, it, es, tr, de, ru, fr, pt și ar.

## v6 – căutare locală în întregul site
- Chatbotul caută acum în două surse locale: baza curată `chatbot-data.js` și indexul complet `chatbot-site-index.js` generat din paginile publice ale site-ului.
- Indexul include paginile Acasă, Despre, Competențe, Proiecte și Contact pentru toate cele 10 limbi.
- Întrebările nu trebuie introduse manual în prealabil: dacă informația există în textul public al site-ului, motorul local o poate găsi prin potrivire lexicală, sinonime și căutare aproximativă.
- Pe site-ul public, browserul poate reîmprospăta în fundal paginile publice ale aceleiași limbi, de pe același domeniu, și descoperă paginile noi listate în `sitemap.xml`. Întrebarea vizitatorului NU este trimisă către server; sunt descărcate doar paginile publice pentru indexare locală.
- În modul offline/file:// se folosește automat indexul inclus în pachet.
- Cost API: 0 EUR. Nu există OpenAI API, tokenuri plătite sau servicii AI externe.
- Date private/nepublicate continuă să nu fie inventate; pentru acestea răspunsul este că informația nu este publicată.

### Fișier nou
- `chatbot-site-index.js` — index local al conținutului public din toate paginile și limbile site-ului.

### Actualizarea conținutului
Pe site-ul public, chatbotul își reîmprospătează în browser conținutul paginilor aceleiași limbi. Indexul inclus în ZIP rămâne fallback pentru încărcare instantanee și utilizare offline.


## v7 – motor local extins, fără costuri
- motor BM25-style pentru relevanță mai bună în indexul local;
- corectare locală/toleranță la greșeli de tastare prin distanță de editare;
- răspuns extractiv din mai multe secțiuni relevante, cu până la 3 surse publice;
- context îmbunătățit pentru întrebări de continuare;
- răspuns pentru salut și întrebări despre capabilitățile asistentului;
- index local regenerat din toate cele 10 limbi ale site-ului;
- refresh în browser doar din paginile publice ale aceluiași domeniu;
- fără OpenAI API, fără chei API, fără server AI, fără abonament și fără cost pe mesaj.

Limita intenționată rămâne siguranța factuală: chatbotul răspunde din conținutul public al site-ului și nu inventează date private sau nepublicate.
