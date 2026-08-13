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
const availableThemes = ['graphite', 'slate', 'light'];
const savedThemeRaw = localStorage.getItem('portfolio-theme');
// Migrate the removed dark-blue theme to Graphite for returning visitors.
const savedTheme = savedThemeRaw === 'dark' ? 'graphite' : savedThemeRaw;
const systemPrefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
const initialTheme = availableThemes.includes(savedTheme) ? savedTheme : (systemPrefersLight ? 'light' : 'graphite');

const themeLabels = {
  graphite: root.dataset.themeGraphiteLabel || 'Switch to graphite theme',
  slate: root.dataset.themeSlateLabel || 'Switch to steel-blue theme',
  light: root.dataset.themeLightLabel || 'Switch to light theme',
};
const themeIcons = { graphite: '◐', slate: '◆', light: '☀' };

function updateThemeMeta(theme) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) return;
  const colors = { graphite: '#1F2329', slate: '#202A35', light: '#FFFFFF' };
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

// =========================================================
// SEO V2.4 — page-specific professional motion design
// No third-party libraries; respects reduced-motion settings.
// =========================================================
(() => {
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

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

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
        active?.scrollIntoView({ block: 'nearest' });
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
