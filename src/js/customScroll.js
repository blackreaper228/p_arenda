// скрипт шапки  и фикс скролла
(function () {
  if (typeof window > 'u' || window.__headerDomInitialized) return;
  window.__headerDomInitialized = !0;
  function l(t, e = 'active') {
    return (t && (t.getAttribute('data-active-class') || t.dataset.activeClass)) || e;
  }
  function f(t, e = 0) {
    const r = document.documentElement,
      n = getComputedStyle(r).getPropertyValue(t),
      o = parseInt(n, 10);
    return Number.isFinite(o) ? o : e;
  }
  function p() {
    const r = document.getElementById('scale-container');
    if (!r) return 1;
    const n = getComputedStyle(r);
    const o = parseFloat(n.zoom);
    if (Number.isFinite(o) && o > 0) return o;
    const u = n.transform;
    if (u && u !== 'none') {
      const a = u.match(/matrix\(([^)]+)\)/);
      if (a && a[1]) {
        const c = a[1].split(',').map((s) => parseFloat(s.trim()));
        if (c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1])) {
          const s = Math.sqrt(c[0] * c[0] + c[1] * c[1]);
          if (Number.isFinite(s) && s > 0) return s;
        }
      }
    }
    return 1;
  }
  function h() {
    const t = navigator.userAgent || '';
    // Safari UA contains "Safari" but not "Chrome/Chromium/Android"
    return /Safari/i.test(t) && !/Chrome|Chromium|Android/i.test(t);
  }
  function g(t) {
    const e = (t || '').replace('#', ''),
      r = f('--header-height', 0);
    let n = 0;
    if (e) {
      const o = document.getElementById(e);
      if (!o) return;
      const u = p();
      const a = o.getBoundingClientRect().top + window.pageYOffset - r;
      // Safari (macOS) + zoom needs compensation; Chrome does not.
      n = h() ? a * u : a;
    } else n = 0;
    const o = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const u = Math.min(Math.max(0, n), o);
    try {
      window.scrollTo({ top: u, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, u);
    }
  }
  function i(t) {
    const e = document.getElementById('header-dropdown'),
      r = document.querySelector('[data-dropdown-overlay]'),
      n = Array.from(document.querySelectorAll('[data-dropdown-trigger]')),
      o = e ? l(e) : 'active',
      u = r ? l(r) : 'active',
      a = typeof t == 'boolean' ? t : !(e && e.classList.contains(o));
    (e && e.classList.toggle(o, a), r && r.classList.toggle(u, a), n.forEach((c) => c.classList.toggle(l(c), a)));
  }
  function d(t) {
    const e = document.getElementById('header-burger-menu'),
      r = document.querySelector('[data-menu-overlay]'),
      n = Array.from(document.querySelectorAll('[data-menu-trigger]')),
      o = e ? l(e) : 'active',
      u = r ? l(r) : 'active',
      a = typeof t == 'boolean' ? t : !(e && e.classList.contains(o));
    (e && e.classList.toggle(o, a), r && r.classList.toggle(u, a), n.forEach((c) => c.classList.toggle(l(c), a)));
  }
  function m() {
    (document.addEventListener('click', (t) => {
      if (t.target.closest('[data-dropdown-trigger]')) {
        (t.preventDefault(), i());
        return;
      }
      if (t.target.closest('[data-menu-trigger]')) {
        (t.preventDefault(), d());
        return;
      }
      if (t.target.closest('[data-dropdown-overlay]')) {
        (t.preventDefault(), i(!1));
        return;
      }
      if (t.target.closest('[data-menu-overlay]')) {
        (t.preventDefault(), d(!1));
        return;
      }
      const u = t.target.closest('#header-burger-menu [data-burger-link]');
      if (u) {
        const s = u.getAttribute('href');
        (d(!1), i(!1), s && s.startsWith('#') && (t.preventDefault(), g(s)));
        return;
      }
      const a = t.target.closest('[data-scroll-to]');
      if (a) {
        const s = a.getAttribute('data-scroll-to');
        s && (t.preventDefault(), d(!1), i(!1), g(s.startsWith('#') ? s : `#${s}`));
        return;
      }
      const c = t.target.closest('a[href^="#"]');
      if (c) {
        const s = c.getAttribute('href');
        (t.preventDefault(), d(!1), i(!1), g(s));
        return;
      }
    }),
      document.addEventListener('keydown', (t) => {
        t.key === 'Escape' && (d(!1), i(!1));
      }));
  }
  m();
})();
