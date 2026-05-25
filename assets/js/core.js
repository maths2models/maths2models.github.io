/* ============================================================
   Maths2Models — core.js
   Page initialization: components, nav, scroll effects
   ============================================================ */

(function () {

  /**
   * Fetch an HTML component and inject it into a container element
   * @param {string} containerId - ID of the container element
   * @param {string} path - path to the HTML component file
   */
  async function loadComponent(containerId, path) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
      const res = await fetch(path);
      if (res.ok) {
        container.outerHTML = await res.text();
      }
    } catch (e) {
      console.warn('Failed to load component:', path, e);
    }
  }

  /**
   * Highlight the active nav link based on current URL path
   */
  function setActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      if (href === '/' && path === '/') {
        link.classList.add('active');
      } else if (href !== '/' && path.startsWith(href)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Initialize theme toggle
   */
  function initThemeToggle() {
    const toggleBtn = document.getElementById('global-theme-toggle');
    const iconSun = document.getElementById('nav-icon-sun');
    const iconMoon = document.getElementById('nav-icon-moon');
    
    if (!toggleBtn || !iconSun || !iconMoon) return;
    
    if (window.M2M?.siteConfig?.feature_flags && window.M2M.siteConfig.feature_flags.enable_dark_mode_toggle === false) {
      toggleBtn.style.display = 'none';
      return;
    }

    // Set initial icon state based on current theme applied by theme.js
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (currentTheme === 'light') {
      iconSun.style.display = 'block';
      iconMoon.style.display = 'none';
    } else {
      iconSun.style.display = 'none';
      iconMoon.style.display = 'block';
    }

    toggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('m2m-theme', newTheme);
      
      if (newTheme === 'light') {
        iconSun.style.display = 'block';
        iconMoon.style.display = 'none';
      } else {
        iconSun.style.display = 'none';
        iconMoon.style.display = 'block';
      }
    });
  }

  /**
   * Initialize mobile menu toggle
   */
  function initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!toggleBtn || !menu) return;

    toggleBtn.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when clicking a link
    menu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /**
   * Add scroll effect to navbar (add 'scrolled' class)
   */
  function initNavScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Check initial state
  }

  /**
   * Initialize Intersection Observer for scroll-triggered animations
   */
  function initScrollEffects() {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe all elements with observe-* classes
    document.querySelectorAll('.observe-fade, .observe-slide-right, .observe-slide-left, .observe-scale').forEach(el => {
      observer.observe(el);
    });

    // Observe stat items for counter animation
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Animate the counter number
          const numEl = entry.target.querySelector('.stat-number');
          if (numEl) {
            const target = parseInt(numEl.dataset.target, 10) || 0;
            M2M.animateCounter(numEl, target, 1500);
          }
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.stat-item').forEach(el => {
      statObserver.observe(el);
    });
  }

  /**
   * Render nav links from site.json into the navbar
   */
  async function renderNavLinks(data) {
    if (!data || !data.nav) return;

    // Desktop nav
    const navLinksEl = document.getElementById('nav-links');
    if (navLinksEl) {
      navLinksEl.innerHTML = data.nav.map(item =>
        `<li><a href="${item.href}" class="nav-link">${M2M.escapeHTML(item.label)}</a></li>`
      ).join('');
    }

    // Mobile nav
    const mobileLinksEl = document.getElementById('mobile-nav-links');
    if (mobileLinksEl) {
      mobileLinksEl.innerHTML = data.nav.map(item =>
        `<a href="${item.href}" class="nav-link">${M2M.escapeHTML(item.label)}</a>`
      ).join('');
    }

    setActiveNav();
  }

  /**
   * Set breadcrumb content
   * @param {Array<{label: string, href?: string}>} items
   */
  M2M.setBreadcrumb = function (items) {
    const container = document.getElementById('breadcrumb-container');
    if (!container) return;
    if (!items || items.length <= 1) {
      container.innerHTML = '';
      return;
    }

    const crumbs = items.map((item, i) => {
      const isLast = i === items.length - 1;
      if (isLast) {
        return `<span class="breadcrumb-item current">${M2M.escapeHTML(item.label)}</span>`;
      }
      return `<span class="breadcrumb-item"><a href="${item.href || '/'}">${M2M.escapeHTML(item.label)}</a></span>`;
    }).join('<span class="breadcrumb-separator">›</span>');

    container.innerHTML = `
      <div class="breadcrumb">
        <div class="container">
          <nav class="breadcrumb-list" aria-label="Breadcrumb">${crumbs}</nav>
        </div>
      </div>
    `;
  };

  /**
   * Initialize the Ctrl+K search shortcut
   */
  function initSearchShortcut() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.location.href = '/search/';
      }
    });
  }

  /**
   * Main initialization — called when DOM is ready
   */
  async function initPage() {
    // Load shared components
    await loadComponent('navbar-container', '/components/navbar.html');
    await loadComponent('footer-container', '/components/footer.html');

    // Hide disabled levels from footer
    const coursesData = await M2M.fetchJSON('/data/courses-index.json');
    if (coursesData && coursesData.levels_status) {
      Object.keys(coursesData.levels_status).forEach(level => {
        if (coursesData.levels_status[level] === false) {
          const footerLink = document.querySelector(`.footer-col a[href*="filter=${level.toLowerCase()}"]`);
          if (footerLink) footerLink.style.display = 'none';
        }
      });
    }

    M2M.siteConfig = await M2M.fetchJSON('/data/site.json') || {};

    if (M2M.siteConfig.global_announcement) {
      const banner = document.createElement('div');
      banner.className = 'global-banner';
      banner.style.backgroundColor = 'var(--primary)';
      banner.style.color = '#fff';
      banner.style.textAlign = 'center';
      banner.style.padding = '0.5rem';
      banner.style.fontWeight = 'bold';
      banner.textContent = M2M.siteConfig.global_announcement;
      document.body.insertBefore(banner, document.body.firstChild);
    }

    // Render dynamic nav links from JSON
    await renderNavLinks(M2M.siteConfig);

    // Initialize interactions
    initMobileMenu();
    initNavScroll();
    initSearchShortcut();
    initThemeToggle();

    // Scroll effects — run after a tiny delay so page content renders first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initScrollEffects();
      });
    });
  }

  /* ── Auto-init on DOM ready ──────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }

  // Expose for manual use
  M2M.loadComponent = loadComponent;
  M2M.initScrollEffects = initScrollEffects;

})();
