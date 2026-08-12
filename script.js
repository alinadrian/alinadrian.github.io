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

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const themeButton = document.querySelector('.theme-toggle');
const availableThemes = ['graphite', 'light'];
const savedThemeRaw = localStorage.getItem('portfolio-theme');
// Migrate the removed dark-blue theme to Graphite for returning visitors.
const savedTheme = savedThemeRaw === 'dark' ? 'graphite' : savedThemeRaw;
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
  const colors = { graphite: '#0d0f11', light: '#eef4f8' };
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
if (savedThemeRaw === 'dark') localStorage.setItem('portfolio-theme', 'graphite');

themeButton?.addEventListener('click', () => {
  const currentIndex = availableThemes.indexOf(root.dataset.theme);
  const nextTheme = availableThemes[(currentIndex + 1) % availableThemes.length];
  root.dataset.theme = nextTheme;
  localStorage.setItem('portfolio-theme', nextTheme);
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

// GitHub Pages is static. The contact form opens the visitor's local email app
// instead of calling a server endpoint, so it works without a backend or stored data.
const form = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');
if (form && formMessage) {
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
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    if (String(data.get('website') || '').trim()) return;

    const destination = form.dataset.contactEmail;
    if (!destination) return;

    const subject = String(data.get('subject') || '').trim();
    const bodyName = form.dataset.bodyName || 'Name';
    const bodyEmail = form.dataset.bodyEmail || 'Email';
    const body = [
      `${bodyName}: ${String(data.get('name') || '').trim()}`,
      `${bodyEmail}: ${String(data.get('email') || '').trim()}`,
      '',
      String(data.get('message') || '').trim(),
    ].join('\n');

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
