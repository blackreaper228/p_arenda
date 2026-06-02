import { applySwiperNavigation, scheduleArendaSwiperBoot } from '../js/arendaSwiperBootstrap.js';

/**
 * Hero carousel on test.html — Swiper slide swipe (desktop + mobile).
 */
(function initArendaHeroSwiperFade() {
  if (window.__arendaHeroSwiperFadeInit) return;
  window.__arendaHeroSwiperFadeInit = true;

  const MOBILE_MAX_WIDTH = 767;

  function narrowViewport() {
    return window.innerWidth <= MOBILE_MAX_WIDTH;
  }

  function syncTextSlides(textSlides, index) {
    textSlides.forEach((el, i) => {
      el.classList.toggle('hidden', i !== index);
    });
  }

  function isMobileNavControl(el) {
    if (!el) return false;
    const mobileWrap = el.closest('[class*="max-md:flex"]');
    if (!mobileWrap) return false;
    const cls = mobileWrap.className || '';
    return cls.includes('hidden') && cls.includes('max-md:flex');
  }

  function pickNav(sliderRoot) {
    const prevAll = Array.from(sliderRoot.querySelectorAll('[data-prev]'));
    const nextAll = Array.from(sliderRoot.querySelectorAll('[data-next]'));
    const narrow = narrowViewport();

    const pick = (all) => {
      if (!all.length) return null;
      if (narrow) {
        const mobile = all.filter(isMobileNavControl);
        if (mobile.length) return mobile[mobile.length - 1];
        return all[all.length - 1];
      }
      const desktop = all.filter((el) => !isMobileNavControl(el));
      if (desktop.length) return desktop[0];
      return all[0];
    };

    return { prevEl: pick(prevAll), nextEl: pick(nextAll) };
  }

  function destroyOne(sliderRoot) {
    const track = sliderRoot.querySelector('[data-track]');
    const container = track?.parentElement;
    const inst = container?.__swiperInstance;
    if (inst && typeof inst.destroy === 'function') inst.destroy(true, false);
    if (container) container.__swiperInstance = null;
  }

  function initOne(sliderRoot) {
    if (sliderRoot.getAttribute('data-swiper-fade') !== 'true') return null;

    const Swiper = window.Swiper;
    if (!Swiper) return null;

    const track = sliderRoot.querySelector('[data-track]');
    if (!track) return null;

    const container = track.parentElement;
    if (!container) return null;

    const { prevEl, nextEl } = pickNav(sliderRoot);

    const existing = container.__swiperInstance;
    if (existing) {
      applySwiperNavigation(existing, prevEl, nextEl);
      if (typeof existing.update === 'function') existing.update();
      return existing;
    }

    container.classList.add('swiper');
    track.classList.add('swiper-wrapper');
    track.classList.remove('w-full');

    const slides = Array.from(track.querySelectorAll('[data-slide]'));
    slides.forEach((slide) => {
      slide.classList.add('swiper-slide');
      slide.classList.remove('absolute', 'opacity-0', 'opacity-100', 'w-full');
      slide.style.opacity = '';
      slide.style.pointerEvents = '';
      slide.style.zIndex = '';
      slide.style.width = '';
    });

    const textSlides = Array.from(sliderRoot.querySelectorAll('[data-text-slide]'));
    const currentEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-current]'));
    const totalEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-total]'));

    totalEls.forEach((el) => {
      el.textContent = String(slides.length);
    });

    const slidesCount = slides.length;
    const mobileTouch = narrowViewport();
    const loopEnabled = !mobileTouch && slidesCount >= 2;

    const getIndex = (sw) => {
      if (loopEnabled && typeof sw.realIndex === 'number') return sw.realIndex;
      return typeof sw.activeIndex === 'number' ? sw.activeIndex : 0;
    };

    const syncFromSwiper = (sw) => {
      const index = getIndex(sw);
      syncTextSlides(textSlides, index);
      currentEls.forEach((el) => {
        el.textContent = String(index + 1);
      });
    };

    const instance = new Swiper(container, {
      slidesPerView: 1,
      spaceBetween: 0,
      loop: loopEnabled,
      speed: 380,
      grabCursor: true,
      simulateTouch: true,
      allowTouchMove: true,
      followFinger: true,
      threshold: 5,
      resistanceRatio: 0.85,
      touchStartPreventDefault: false,
      touchEventsTarget: 'container',
      navigation: prevEl && nextEl ? { prevEl, nextEl } : undefined,
      on: {
        init(sw) {
          syncFromSwiper(sw);
        },
        slideChange(sw) {
          syncFromSwiper(sw);
        },
      },
    });

    container.__swiperInstance = instance;
    return instance;
  }

  function initAll() {
    document.querySelectorAll('[data-swiper-fade="true"]').forEach((root) => {
      destroyOne(root);
      initOne(root);
    });
  }

  let lastLayoutWidth = window.innerWidth;
  let resizeRefreshTimer = null;

  function initAllIfWidthChanged() {
    clearTimeout(resizeRefreshTimer);
    resizeRefreshTimer = setTimeout(() => {
      const width = window.visualViewport?.width ?? window.innerWidth;
      if (Math.abs(width - lastLayoutWidth) < 2) return;
      lastLayoutWidth = width;
      initAll();
    }, 250);
  }

  function initAllOnOrientationChange() {
    lastLayoutWidth = window.visualViewport?.width ?? window.innerWidth;
    clearTimeout(resizeRefreshTimer);
    initAll();
  }

  window.initArendaHeroSwiperFade = initAll;

  scheduleArendaSwiperBoot(initAll);

  window.addEventListener('resize', initAllIfWidthChanged);
  window.addEventListener('orientationchange', initAllOnOrientationChange);
})();
