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

  function pickNav(sliderRoot) {
    const prevAll = Array.from(sliderRoot.querySelectorAll('[data-prev]')).filter(isVisible);
    const nextAll = Array.from(sliderRoot.querySelectorAll('[data-next]')).filter(isVisible);
    return {
      prevEl: prevAll[0] ?? null,
      nextEl: nextAll[0] ?? null,
    };
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

    if (container.__swiperInstance) return container.__swiperInstance;

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
    const { prevEl, nextEl } = pickNav(sliderRoot);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.addEventListener('resize', initAllIfWidthChanged);
  window.addEventListener('orientationchange', initAllOnOrientationChange);
})();
