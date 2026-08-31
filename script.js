const root = document.documentElement;
const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? document.body.dataset.menuClose : document.body.dataset.menuOpen);
  });

  navLinks.forEach((link) => link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', document.body.dataset.menuOpen);
  }));
}

const revealElements = Array.from(document.querySelectorAll('.reveal'));
const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
try {
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealElements.forEach((element) => element.classList.add('reveal-pending'));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    revealElements.forEach((element) => observer.observe(element));
    window.setTimeout(() => revealElements.forEach((element) => element.classList.add('visible')), 1800);
  } else {
    revealElements.forEach((element) => element.classList.add('visible'));
  }
} catch (_) {
  revealElements.forEach((element) => {
    element.classList.remove('reveal-pending');
    element.classList.add('visible');
  });
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const themeButton = document.querySelector('.theme-toggle');
if (themeButton) { themeButton.hidden = false; themeButton.style.removeProperty('display'); }
const availableThemes = ['graphite', 'light'];
const safeStorage = {
  get(key) {
    try { return window.localStorage?.getItem(key) ?? null; } catch (_) { return null; }
  },
  set(key, value) {
    try { window.localStorage?.setItem(key, value); } catch (_) { /* Storage may be blocked in preview/private contexts. */ }
  },
};
const savedThemeRaw = safeStorage.get('portfolio-theme');
// Migrate the removed dark-blue theme to Graphite for returning visitors.
const savedTheme = (savedThemeRaw === 'dark' || savedThemeRaw === 'slate' || savedThemeRaw === 'mint') ? 'graphite' : savedThemeRaw;
const systemPrefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
const initialTheme = availableThemes.includes(savedTheme) ? savedTheme : (systemPrefersLight ? 'light' : 'graphite');

const themeLabels = {
  graphite: root.dataset.themeGraphiteLabel || 'Switch to graphite theme',
  light: root.dataset.themeLightLabel || 'Switch to light theme',
};
const themeIcons = { graphite: '◐', light: '☀' };

function updateThemeMeta(theme) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) return;
  const colors = { graphite: '#1F2329', light: '#FFFFFF' };
  metaThemeColor.setAttribute('content', colors[theme] || colors.graphite);
}

function updateThemeButton(theme) {
  if (!themeButton) return;
  const currentIndex = availableThemes.indexOf(theme);
  const nextTheme = availableThemes[(currentIndex + 1) % availableThemes.length];
  const indicators = availableThemes
    .map((item) => `<i class="${item === theme ? 'active' : ''}" aria-hidden="true"></i>`)
    .join('');

  themeButton.innerHTML = `
    <span class="theme-main-icon" aria-hidden="true">${themeIcons[nextTheme]}</span>
    <span class="theme-indicators" aria-hidden="true">${indicators}</span>
  `;
  themeButton.dataset.currentTheme = theme;
  themeButton.setAttribute('aria-label', themeLabels[nextTheme]);
  themeButton.setAttribute('title', themeLabels[nextTheme]);
  updateThemeMeta(theme);
}

root.dataset.theme = initialTheme;
updateThemeButton(initialTheme);

// Remove the obsolete saved value once migrated.
if (savedThemeRaw === 'dark' || savedThemeRaw === 'slate' || savedThemeRaw === 'mint') safeStorage.set('portfolio-theme', 'graphite');

themeButton?.addEventListener('click', () => {
  const currentIndex = availableThemes.indexOf(root.dataset.theme);
  const nextTheme = availableThemes[(currentIndex + 1) % availableThemes.length];
  root.dataset.theme = nextTheme;
  safeStorage.set('portfolio-theme', nextTheme);
  updateThemeButton(nextTheme);
});

const typingElement = document.querySelector('[data-typing]');
if (typingElement && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let words = [];
  try { words = JSON.parse(typingElement.dataset.typing || '[]'); } catch (_) { words = []; }
  if (words.length) {
    let wordIndex = 0;
    let charIndex = words[0].length;
    let deleting = true;
    const tick = () => {
      const word = words[wordIndex];
      typingElement.textContent = word.slice(0, charIndex);
      if (deleting) {
        charIndex -= 1;
        if (charIndex < 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          charIndex = 0;
          setTimeout(tick, 280);
          return;
        }
      } else {
        charIndex += 1;
        if (charIndex > words[wordIndex].length) {
          deleting = true;
          charIndex = words[wordIndex].length;
          setTimeout(tick, 1300);
          return;
        }
      }
      setTimeout(tick, deleting ? 45 : 75);
    };
    setTimeout(tick, 1200);
  }
}

const filterButtons = document.querySelectorAll('[data-filter]');
const projectCards = document.querySelectorAll('[data-category]');
const filterResult = document.getElementById('filter-result');
filterButtons.forEach((button) => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  filterButtons.forEach((item) => item.classList.toggle('active', item === button));
  let visibleCount = 0;
  projectCards.forEach((card) => {
    const show = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('is-hidden', !show);
    if (show) visibleCount += 1;
  });
  if (filterResult) {
    filterResult.textContent = `${visibleCount} ${visibleCount === 1 ? filterResult.dataset.singular : filterResult.dataset.plural}`;
  }
}));


// V2.5.0 — optional international callback number, fully client-side / zero-cost.
const internationalDialCodes = [{"country":"Afghanistan","code":"+93"},{"country":"Albania","code":"+355"},{"country":"Algeria","code":"+213"},{"country":"American Samoa","code":"+1684"},{"country":"Angola","code":"+244"},{"country":"Anguilla","code":"+1264"},{"country":"Antigua and Barbuda","code":"+1268"},{"country":"Argentina","code":"+54"},{"country":"Armenia","code":"+374"},{"country":"Aruba","code":"+297"},{"country":"Australia","code":"+61"},{"country":"Austria","code":"+43"},{"country":"Azerbaijan","code":"+994"},{"country":"Bahrain","code":"+973"},{"country":"Bangladesh","code":"+880"},{"country":"Barbados","code":"+1246"},{"country":"Belarus","code":"+375"},{"country":"Belgium","code":"+32"},{"country":"Belize","code":"+501"},{"country":"Benin","code":"+229"},{"country":"Bermuda","code":"+1441"},{"country":"Bhutan","code":"+975"},{"country":"Bolivia","code":"+591"},{"country":"Bosnia and Herzegovina","code":"+387"},{"country":"Botswana","code":"+267"},{"country":"Brazil","code":"+55"},{"country":"British Indian Ocean Territory","code":"+246"},{"country":"Brunei","code":"+673"},{"country":"Bulgaria","code":"+359"},{"country":"Burkina Faso","code":"+226"},{"country":"Burundi","code":"+257"},{"country":"Cambodia","code":"+855"},{"country":"Cameroon","code":"+237"},{"country":"Canada","code":"+1"},{"country":"Cape Verde","code":"+238"},{"country":"Cayman Islands","code":"+1345"},{"country":"Central African Republic","code":"+236"},{"country":"Chad","code":"+235"},{"country":"Chile","code":"+56"},{"country":"China","code":"+86"},{"country":"Christmas Island","code":"+61"},{"country":"Cocos (Keeling) Islands","code":"+61"},{"country":"Colombia","code":"+57"},{"country":"Comoros","code":"+269"},{"country":"Cook Islands","code":"+682"},{"country":"Costa Rica","code":"+506"},{"country":"Croatia","code":"+385"},{"country":"Cuba","code":"+53"},{"country":"Cyprus","code":"+357"},{"country":"Czech Republic","code":"+420"},{"country":"Democratic Republic of the Congo","code":"+243"},{"country":"Denmark","code":"+45"},{"country":"Djibouti","code":"+253"},{"country":"Dominica","code":"+1767"},{"country":"Dominican Republic","code":"+1809"},{"country":"Dominican Republic","code":"+1829"},{"country":"Dominican Republic","code":"+1849"},{"country":"East Timor","code":"+670"},{"country":"Ecuador","code":"+593"},{"country":"Egypt","code":"+20"},{"country":"El Salvador","code":"+503"},{"country":"Equatorial Guinea","code":"+240"},{"country":"Eritrea","code":"+291"},{"country":"Estonia","code":"+372"},{"country":"Ethiopia","code":"+251"},{"country":"Falkland Islands","code":"+500"},{"country":"Faroe Islands","code":"+298"},{"country":"Federated States of Micronesia","code":"+691"},{"country":"Fiji","code":"+679"},{"country":"Finland","code":"+358"},{"country":"France","code":"+33"},{"country":"French Guiana","code":"+594"},{"country":"French Polynesia","code":"+689"},{"country":"Gabon","code":"+241"},{"country":"Georgia","code":"+995"},{"country":"Germany","code":"+49"},{"country":"Ghana","code":"+233"},{"country":"Gibraltar","code":"+350"},{"country":"Greece","code":"+30"},{"country":"Greenland","code":"+299"},{"country":"Grenada","code":"+1473"},{"country":"Guadeloupe","code":"+590"},{"country":"Guam","code":"+1671"},{"country":"Guatemala","code":"+502"},{"country":"Guernsey","code":"+44"},{"country":"Guinea","code":"+224"},{"country":"Guinea-Bissau","code":"+245"},{"country":"Guyana","code":"+592"},{"country":"Haiti","code":"+509"},{"country":"Honduras","code":"+504"},{"country":"Hong Kong","code":"+852"},{"country":"Hungary","code":"+36"},{"country":"Iceland","code":"+354"},{"country":"India","code":"+91"},{"country":"Indonesia","code":"+62"},{"country":"Iran","code":"+98"},{"country":"Iraq","code":"+964"},{"country":"Ireland","code":"+353"},{"country":"Isle of Man","code":"+44"},{"country":"Israel","code":"+972"},{"country":"Italy","code":"+39"},{"country":"Ivory Coast","code":"+225"},{"country":"Jamaica","code":"+1876"},{"country":"Japan","code":"+81"},{"country":"Jersey","code":"+44"},{"country":"Jordan","code":"+962"},{"country":"Kazakhstan","code":"+76"},{"country":"Kazakhstan","code":"+77"},{"country":"Kenya","code":"+254"},{"country":"Kiribati","code":"+686"},{"country":"Kuwait","code":"+965"},{"country":"Kyrgyzstan","code":"+996"},{"country":"Laos","code":"+856"},{"country":"Latvia","code":"+371"},{"country":"Lebanon","code":"+961"},{"country":"Lesotho","code":"+266"},{"country":"Liberia","code":"+231"},{"country":"Libya","code":"+218"},{"country":"Liechtenstein","code":"+423"},{"country":"Lithuania","code":"+370"},{"country":"Luxembourg","code":"+352"},{"country":"Macau","code":"+853"},{"country":"Madagascar","code":"+261"},{"country":"Malawi","code":"+265"},{"country":"Malaysia","code":"+60"},{"country":"Maldives","code":"+960"},{"country":"Mali","code":"+223"},{"country":"Malta","code":"+356"},{"country":"Marshall Islands","code":"+692"},{"country":"Martinique","code":"+596"},{"country":"Mauritania","code":"+222"},{"country":"Mauritius","code":"+230"},{"country":"Mayotte","code":"+262"},{"country":"Mexico","code":"+52"},{"country":"Moldova","code":"+373"},{"country":"Monaco","code":"+377"},{"country":"Mongolia","code":"+976"},{"country":"Montserrat","code":"+1664"},{"country":"Morocco","code":"+212"},{"country":"Mozambique","code":"+258"},{"country":"Namibia","code":"+264"},{"country":"Nauru","code":"+674"},{"country":"Nepal","code":"+977"},{"country":"Netherlands","code":"+31"},{"country":"New Caledonia","code":"+687"},{"country":"New Zealand","code":"+64"},{"country":"Nicaragua","code":"+505"},{"country":"Niger","code":"+227"},{"country":"Nigeria","code":"+234"},{"country":"Niue","code":"+683"},{"country":"Norfolk Island","code":"+672"},{"country":"North Korea","code":"+850"},{"country":"Northern Mariana Islands","code":"+1670"},{"country":"Norway","code":"+47"},{"country":"Oman","code":"+968"},{"country":"Pakistan","code":"+92"},{"country":"Palau","code":"+680"},{"country":"Panama","code":"+507"},{"country":"Papua New Guinea","code":"+675"},{"country":"Paraguay","code":"+595"},{"country":"Peru","code":"+51"},{"country":"Philippines","code":"+63"},{"country":"Pitcairn Islands","code":"+64"},{"country":"Poland","code":"+48"},{"country":"Portugal","code":"+351"},{"country":"Puerto Rico","code":"+1787"},{"country":"Puerto Rico","code":"+1939"},{"country":"Qatar","code":"+974"},{"country":"Republic of Macedonia","code":"+389"},{"country":"Republic of the Congo","code":"+242"},{"country":"Romania","code":"+40"},{"country":"Russia","code":"+7"},{"country":"Rwanda","code":"+250"},{"country":"Réunion","code":"+262"},{"country":"Saint Helena","code":"+290"},{"country":"Saint Kitts and Nevis","code":"+1869"},{"country":"Saint Lucia","code":"+1758"},{"country":"Saint Pierre and Miquelon","code":"+508"},{"country":"Saint Vincent and the Grenadines","code":"+1784"},{"country":"Samoa","code":"+685"},{"country":"San Marino","code":"+378"},{"country":"Saudi Arabia","code":"+966"},{"country":"Senegal","code":"+221"},{"country":"Serbia","code":"+381"},{"country":"Seychelles","code":"+248"},{"country":"Sierra Leone","code":"+232"},{"country":"Singapore","code":"+65"},{"country":"Slovakia","code":"+421"},{"country":"Slovenia","code":"+386"},{"country":"Solomon Islands","code":"+677"},{"country":"Somalia","code":"+252"},{"country":"South Africa","code":"+27"},{"country":"South Georgia","code":"+500"},{"country":"South Korea","code":"+82"},{"country":"South Sudan","code":"+211"},{"country":"Spain","code":"+34"},{"country":"Sri Lanka","code":"+94"},{"country":"Sudan","code":"+249"},{"country":"Suriname","code":"+597"},{"country":"Svalbard and Jan Mayen","code":"+4779"},{"country":"Swaziland","code":"+268"},{"country":"Sweden","code":"+46"},{"country":"Switzerland","code":"+41"},{"country":"Syria","code":"+963"},{"country":"São Tomé and Príncipe","code":"+239"},{"country":"Taiwan","code":"+886"},{"country":"Tajikistan","code":"+992"},{"country":"Tanzania","code":"+255"},{"country":"Thailand","code":"+66"},{"country":"The Bahamas","code":"+1242"},{"country":"The Gambia","code":"+220"},{"country":"Togo","code":"+228"},{"country":"Tokelau","code":"+690"},{"country":"Tonga","code":"+676"},{"country":"Trinidad and Tobago","code":"+1868"},{"country":"Tunisia","code":"+216"},{"country":"Turkey","code":"+90"},{"country":"Turkmenistan","code":"+993"},{"country":"Tuvalu","code":"+688"},{"country":"Uganda","code":"+256"},{"country":"Ukraine","code":"+380"},{"country":"United Arab Emirates","code":"+971"},{"country":"United Kingdom","code":"+44"},{"country":"United States","code":"+1"},{"country":"Uruguay","code":"+598"},{"country":"Uzbekistan","code":"+998"},{"country":"Vanuatu","code":"+678"},{"country":"Venezuela","code":"+58"},{"country":"Vietnam","code":"+84"},{"country":"Wallis and Futuna","code":"+681"},{"country":"Western Sahara","code":"+212"},{"country":"Yemen","code":"+967"},{"country":"Zambia","code":"+260"},{"country":"Zimbabwe","code":"+263"}];
const populateInternationalDialCodes = (form) => {
  const select = form?.querySelector('[data-phone-prefix]');
  if (!select || select.dataset.loaded === 'true') return;
  const placeholder = select.dataset.placeholder || 'Country code';
  select.textContent = '';
  const first = document.createElement('option');
  first.value = '';
  first.textContent = placeholder;
  select.appendChild(first);
  const fragment = document.createDocumentFragment();
  internationalDialCodes.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.code;
    option.textContent = `${item.code} · ${item.country}`;
    fragment.appendChild(option);
  });
  select.appendChild(fragment);
  select.dataset.loaded = 'true';
};

const validateOptionalPhone = (form) => {
  const phone = form?.querySelector('input[name="phone"]');
  const prefix = form?.querySelector('select[name="phone_prefix"]');
  if (!phone || !prefix) return true;
  phone.setCustomValidity('');
  prefix.setCustomValidity('');
  const raw = phone.value.trim();
  const code = prefix.value.trim();
  if (!raw && !code) return true;
  const digits = raw.replace(/\D/g, '');
  const codeDigits = code.replace(/\D/g, '');
  const valid = !!raw && !!code && digits.length >= 4 && digits.length + codeDigits.length <= 15;
  if (!valid) {
    const message = form.dataset.phoneInvalid || 'Enter a valid phone number and select the international country code.';
    if (!code) prefix.setCustomValidity(message);
    else phone.setCustomValidity(message);
  }
  return valid;
};

// GitHub Pages is static. The contact form opens the visitor's local email app
// instead of calling a server endpoint, so it works without a backend or stored data.
const form = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');
if (form && formMessage) {
  populateInternationalDialCodes(form);
  const phoneInput = form.querySelector('input[name="phone"]');
  const phonePrefix = form.querySelector('select[name="phone_prefix"]');
  [phoneInput, phonePrefix].filter(Boolean).forEach((field) => field.addEventListener('input', () => validateOptionalPhone(form)));
  const trap = document.createElement('input');
  trap.name = 'website';
  trap.type = 'text';
  trap.tabIndex = -1;
  trap.autocomplete = 'off';
  trap.setAttribute('aria-hidden', 'true');
  trap.className = 'honeypot';
  form.appendChild(trap);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    validateOptionalPhone(form);
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    if (String(data.get('website') || '').trim()) return;

    const destination = form.dataset.contactEmail;
    if (!destination) return;

    const subject = String(data.get('subject') || '').trim();
    const bodyName = form.dataset.bodyName || 'Name';
    const bodyEmail = form.dataset.bodyEmail || 'Email';
    const bodyPhone = form.dataset.bodyPhone || 'Phone';
    const phoneNumber = String(data.get('phone') || '').trim();
    const phoneCode = String(data.get('phone_prefix') || '').trim();
    const bodyLines = [
      `${bodyName}: ${String(data.get('name') || '').trim()}`,
      `${bodyEmail}: ${String(data.get('email') || '').trim()}`,
    ];
    if (phoneNumber && phoneCode) bodyLines.push(`${bodyPhone}: ${phoneCode} ${phoneNumber}`);
    bodyLines.push('', String(data.get('message') || '').trim());
    const body = bodyLines.join('\n');

    const mailto = `mailto:${destination}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    formMessage.textContent = form.dataset.formStatus || '';
    window.location.href = mailto;
  });
}

const backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.type = 'button';
backToTop.setAttribute('aria-label', root.dataset.backTopLabel || 'Back to top');
backToTop.textContent = '↑';
document.body.appendChild(backToTop);
window.addEventListener('scroll', () => backToTop.classList.toggle('visible', window.scrollY > 650), { passive: true });
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// =========================================================
// SEO V2.4 — page-specific professional motion design
// No third-party libraries; respects reduced-motion settings.
// =========================================================
(() => {
  try {
  const filename = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const pageByFile = {
    'index.html': 'home',
    'despre.html': 'about', 'about.html': 'about', 'chi-sono.html': 'about', 'hakkimda.html': 'about', 'ueber-mich.html': 'about', 'obo-mne.html': 'about', 'a-propos.html': 'about', 'sobre.html': 'about',
    'competente.html': 'skills', 'skills.html': 'skills', 'competenze.html': 'skills', 'beceriler.html': 'skills', 'kompetenzen.html': 'skills', 'navyki.html': 'skills', 'competences.html': 'skills', 'competencias.html': 'skills',
    'proiecte.html': 'projects', 'projects.html': 'projects', 'progetti.html': 'projects', 'projeler.html': 'projects', 'projekte.html': 'projects', 'proekty.html': 'projects', 'projets.html': 'projects', 'projetos.html': 'projects',
    'contact.html': 'contact', 'contatti.html': 'contact', 'iletisim.html': 'contact', 'kontakt.html': 'contact', 'contato.html': 'contact',
  };
  const page = pageByFile[filename];
  if (!page) return;
  document.body.classList.add(`page-${page}`);

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (prefersReducedMotion) return;

  // Homepage: a low-density canvas particle field with short connecting lines.
  if (page === 'home') {
    const hero = document.querySelector('.hero');
    if (hero) {
      const canvas = document.createElement('canvas');
      canvas.className = 'tech-particles';
      canvas.setAttribute('aria-hidden', 'true');
      hero.prepend(canvas);

      const glyphLayer = document.createElement('div');
      glyphLayer.className = 'tech-glyph-layer';
      glyphLayer.setAttribute('aria-hidden', 'true');
      const glyphs = ['{ }', '</>', '01', 'λ', 'API', '[]'];
      const positions = [[8,23],[22,74],[48,14],[67,77],[84,32],[92,66]];
      glyphs.forEach((text, index) => {
        const span = document.createElement('span');
        span.className = 'tech-glyph';
        span.textContent = text;
        span.style.left = `${positions[index][0]}%`;
        span.style.top = `${positions[index][1]}%`;
        span.style.animationDelay = `${-index * 2.7}s`;
        glyphLayer.appendChild(span);
      });
      hero.prepend(glyphLayer);

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;
      let width = 1;
      let height = 1;
      let dpr = 1;
      let particles = [];
      let raf = 0;
      let isVisible = true;

      const hexToRgba = (hex, alpha) => {
        const normalized = String(hex || '').trim();
        const match = /^#([0-9a-f]{6})$/i.exec(normalized);
        if (!match) return `rgba(90,176,255,${alpha})`;
        const value = parseInt(match[1], 16);
        return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
      };

      const themeColors = () => {
        const style = getComputedStyle(document.documentElement);
        return {
          primary: style.getPropertyValue('--primary').trim() || '#4ee1a0',
          secondary: style.getPropertyValue('--secondary').trim() || '#5ab0ff',
        };
      };

      const makeParticles = () => {
        const compact = window.innerWidth < 760;
        const count = compact ? 16 : Math.min(38, Math.max(24, Math.round(width / 32)));
        particles = Array.from({ length: count }, (_, i) => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - .5) * (compact ? .085 : .13),
          vy: (Math.random() - .5) * (compact ? .085 : .13),
          r: .75 + Math.random() * 1.05,
          type: i % 3,
        }));
      };

      const resize = () => {
        const rect = hero.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        dpr = Math.min(window.devicePixelRatio || 1, 1.6);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        makeParticles();
      };

      const draw = () => {
        if (!isVisible) { raf = requestAnimationFrame(draw); return; }
        ctx.clearRect(0, 0, width, height);
        const colors = themeColors();
        const linkDistance = window.innerWidth < 760 ? 92 : 126;

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -8) p.x = width + 8;
          if (p.x > width + 8) p.x = -8;
          if (p.y < -8) p.y = height + 8;
          if (p.y > height + 8) p.y = -8;
        });

        for (let i = 0; i < particles.length; i += 1) {
          for (let j = i + 1; j < particles.length; j += 1) {
            const a = particles[i];
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist < linkDistance) {
              const alpha = (1 - dist / linkDistance) * .085;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = hexToRgba(i % 2 ? colors.primary : colors.secondary, alpha);
              ctx.lineWidth = .65;
              ctx.stroke();
            }
          }
        }

        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(p.type ? colors.secondary : colors.primary, .28);
          ctx.fill();
        });
        raf = requestAnimationFrame(draw);
      };

      // Throttled window resize avoids ResizeObserver loop warnings while keeping
      // the professional particle background responsive.
      let resizeRaf = 0;
      const scheduleResize = () => {
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          resizeRaf = 0;
          resize();
        });
      };
      window.addEventListener('resize', scheduleResize, { passive: true });
      window.addEventListener('orientationchange', scheduleResize, { passive: true });
      if (document.fonts?.ready) document.fonts.ready.then(scheduleResize).catch(() => {});
      document.addEventListener('visibilitychange', () => { isVisible = !document.hidden; });
      resize();
      draw();
      window.addEventListener('pagehide', () => {
        cancelAnimationFrame(raf);
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
      }, { once: true });
    }
  }

  // Projects: restrained pointer tilt on capable desktop pointers only.
  if (page === 'projects' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.project-wide').forEach((card) => {
      const reset = () => {
        card.style.transform = '';
        card.style.removeProperty('--glow-x');
        card.style.removeProperty('--glow-y');
      };
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rotateY = (x - .5) * 2.2;
        const rotateX = (.5 - y) * 1.7;
        card.style.setProperty('--glow-x', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--glow-y', `${(y * 100).toFixed(1)}%`);
        card.style.transform = `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', reset);
      card.addEventListener('blur', reset, true);
    });
  }


  // Discreet protection for personal profile media only.
  // This intentionally does NOT disable right-click, selection or keyboard shortcuts site-wide.
  document.querySelectorAll('[data-protected-media]').forEach((media) => {
    media.querySelectorAll('img').forEach((img) => {
      img.draggable = false;
      img.setAttribute('draggable', 'false');
    });
  });

  // Capture-phase protection is deliberately scoped to profile media.
  // The transparent shield means the browser never receives the actual <img> as the right-click target.
  ['contextmenu', 'dragstart', 'selectstart'].forEach((type) => {
    document.addEventListener(type, (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || !target.closest('[data-protected-media]')) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }, true);
  });

  } catch (_) {
    // Motion is progressive enhancement only; core content remains fully usable.
  }
})();


// SEO V2.4.6 — compact language dropdown behavior
(() => {
  const selectors = document.querySelectorAll('[data-language-selector]');
  if (!selectors.length) return;

  const closeAll = (except = null) => selectors.forEach((selector) => {
    if (selector === except) return;
    selector.classList.remove('open');
    selector.querySelector('.language-current')?.setAttribute('aria-expanded', 'false');
  });

  selectors.forEach((selector) => {
    const button = selector.querySelector('.language-current');
    const menu = selector.querySelector('.language-menu');
    if (!button || !menu) return;

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = !selector.classList.contains('open');
      closeAll(selector);
      selector.classList.toggle('open', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
      if (willOpen) {
        const active = menu.querySelector('.language-option.active');
        try { active?.scrollIntoView({ block: 'nearest' }); } catch (_) { /* Non-critical preview fallback. */ }
      }
    });

    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      selector.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }));
  });

  document.addEventListener('click', () => closeAll());
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
})();
