/**
 * Swiper init for `[data-slider][data-mobile-carousel="true"]` translate carousels.
 * Wrapped in an IIFE so no global `isMobile` / `refreshOnResize` names collide with Tilda
 * or other fragments (avoids "isMobile is not a function" when scripts merge oddly).
 */
(function initArendaSwiperCarousels() {
  if (window.__arendaSwiperCarouselsInit) return;
  window.__arendaSwiperCarouselsInit = true;

  const MOBILE_MAX_WIDTH = 767;

  function narrowViewport() {
    return window.innerWidth <= MOBILE_MAX_WIDTH;
  }

  function getSwiper() {
    return window.Swiper;
  }

  function ensureSwiperStructure(sliderRoot) {
    const track = sliderRoot.querySelector('[data-track]');
    if (!track) return null;

    const container = track.parentElement;
    if (!container) return null;

    container.classList.add('swiper');
    track.classList.add('swiper-wrapper');

    const slides = Array.from(track.querySelectorAll('[data-slide]'));
    slides.forEach((s) => s.classList.add('swiper-slide'));

    return { container, track };
  }

  function isVisible(el) {
    if (!el) return false;
    let node = el;
    while (node && node.nodeType === 1) {
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      node = node.parentElement;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /** Mobile nav lives in `hidden max-md:flex` blocks; desktop uses `max-md:hidden`. */
  function isMobileNavControl(el) {
    if (!el) return false;
    const mobileWrap = el.closest('[class*="max-md:flex"]');
    if (!mobileWrap) return false;
    const cls = mobileWrap.className || '';
    return cls.includes('hidden') && cls.includes('max-md:flex');
  }

  function pickVisibleNav(sliderRoot) {
    const prevAll = Array.from(sliderRoot.querySelectorAll('[data-prev]'));
    const nextAll = Array.from(sliderRoot.querySelectorAll('[data-next]'));
    const narrow = narrowViewport();

    const pick = (all) => {
      const visible = all.filter(isVisible);
      if (!visible.length) return null;

      if (narrow) {
        const mobile = visible.filter(isMobileNavControl);
        if (mobile.length) return mobile[mobile.length - 1];
        return visible[visible.length - 1];
      }

      const desktop = visible.filter((el) => !isMobileNavControl(el));
      if (desktop.length) return desktop[0];
      return visible[0];
    };

    return { prevEl: pick(prevAll), nextEl: pick(nextAll) };
  }

  function swiperAllScreens(sliderRoot) {
    return sliderRoot.getAttribute('data-swiper-all-screens') === 'true';
  }

  function initOne(sliderRoot) {
    const allScreens = swiperAllScreens(sliderRoot);
    if (!narrowViewport() && !allScreens) return null;
    if (sliderRoot.getAttribute('data-mobile-carousel') !== 'true') return null;
    if ((sliderRoot.getAttribute('data-mode') || '').toLowerCase() !== 'translate') return null;

    const Swiper = getSwiper();
    if (!Swiper) return null;

    const structure = ensureSwiperStructure(sliderRoot);
    if (!structure) return null;

    const { container } = structure;
    const { prevEl, nextEl } = pickVisibleNav(sliderRoot);
    const loop = sliderRoot.getAttribute('data-infinite') === 'true';
    const edgeRaw = sliderRoot.getAttribute('data-swiper-edge');
    const edgeInset = edgeRaw != null && String(edgeRaw).trim() !== '' ? Math.max(0, parseInt(edgeRaw, 10) || 0) : 0;
    const offsetAfterDesktopRaw = sliderRoot.getAttribute('data-swiper-offset-after-desktop');
    const offsetAfterDesktop =
      offsetAfterDesktopRaw != null && String(offsetAfterDesktopRaw).trim() !== '' ? Math.max(0, parseInt(offsetAfterDesktopRaw, 10) || 0) : 0;
    const currentEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-current]'));
    const totalEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-total]'));
    const slidesCount = Array.from(sliderRoot.querySelectorAll('[data-track] [data-slide]')).length;
    totalEls.forEach((el) => (el.textContent = String(slidesCount || 0)));
    const loopEnabled = allScreens ? false : loop && slidesCount >= 5;

    if (container.__swiperInstance) return container.__swiperInstance;

    const baseOptions = {
      slidesPerView: 'auto',
      spaceBetween: 0,
      loop: loopEnabled,
      ...(edgeInset > 0 ? { slidesOffsetBefore: edgeInset, slidesOffsetAfter: edgeInset } : {}),
      speed: 380,
      resistanceRatio: 0.85,
      followFinger: true,
      threshold: 5,
      grabCursor: allScreens,
      simulateTouch: allScreens,
      preventInteractionOnTransition: false,
      navigation: prevEl && nextEl ? { prevEl, nextEl } : undefined,
      on: {
        init(sw) {
          const realIndex = typeof sw.realIndex === 'number' ? sw.realIndex : 0;
          currentEls.forEach((el) => (el.textContent = String(realIndex + 1)));
        },
        slideChange(sw) {
          const realIndex = typeof sw.realIndex === 'number' ? sw.realIndex : 0;
          currentEls.forEach((el) => (el.textContent = String(realIndex + 1)));
        },
      },
    };

    if (allScreens) {
      const wideSlides = sliderRoot.getAttribute('data-swiper-wide-slides') === 'true';
      if (!wideSlides) {
        baseOptions.breakpoints = {
          0: {
            spaceBetween: 0,
            ...(offsetAfterDesktop > 0 ? { slidesOffsetAfter: 0 } : {}),
          },
          1024: {
            spaceBetween: 2,
            ...(offsetAfterDesktop > 0 ? { slidesOffsetAfter: offsetAfterDesktop } : {}),
          },
        };
      } else if (offsetAfterDesktop > 0) {
        baseOptions.breakpoints = {
          0: { spaceBetween: 0, slidesOffsetAfter: 0 },
          1024: { spaceBetween: 0, slidesOffsetAfter: offsetAfterDesktop },
        };
      }
    }

    const instance = new Swiper(container, baseOptions);

    container.__swiperInstance = instance;
    return instance;
  }

  function destroyOne(sliderRoot) {
    const track = sliderRoot.querySelector('[data-track]');
    const container = track?.parentElement;
    const inst = container?.__swiperInstance;
    if (inst && typeof inst.destroy === 'function') inst.destroy(true, false);
    if (container) container.__swiperInstance = null;
  }

  function initAll() {
    const roots = Array.from(document.querySelectorAll('[data-slider][data-mobile-carousel="true"]'));
    roots.forEach((r) => initOne(r));
  }

  function refreshOnResize() {
    const roots = Array.from(document.querySelectorAll('[data-slider][data-mobile-carousel="true"]'));
    roots.forEach((r) => {
      const track = r.querySelector('[data-track]');
      const container = track?.parentElement;
      const inst = container?.__swiperInstance;

      if (!narrowViewport() && !swiperAllScreens(r)) {
        if (inst) destroyOne(r);
        return;
      }
      if (inst) destroyOne(r);
      initOne(r);
    });
  }

  /** For Tilda / dynamic blocks — re-init one carousel after HTML changes. */
  function initArendaSwiperCarousel(root) {
    if (root) {
      destroyOne(root);
      return initOne(root);
    }
    initAll();
  }

  window.initArendaSwiperCarousel = initArendaSwiperCarousel;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.addEventListener('resize', refreshOnResize);
  window.addEventListener('orientationchange', refreshOnResize);
})();
