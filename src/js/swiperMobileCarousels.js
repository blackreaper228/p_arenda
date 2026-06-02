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

    getOriginalSlides(track).forEach((s) => s.classList.add('swiper-slide'));

    return { container, track };
  }

  const LOOP_CLONE_ATTR = 'data-swiper-loop-clone';
  const DUPLICATE_CLONE_ATTR = 'data-swiper-duplicate-clone';

  function removeLoopClones(track) {
    if (!track) return;
    track.querySelectorAll(`[${LOOP_CLONE_ATTR}]`).forEach((el) => el.remove());
  }

  function removeDuplicateClones(track) {
    if (!track) return;
    track.querySelectorAll(`[${DUPLICATE_CLONE_ATTR}]`).forEach((el) => el.remove());
  }

  function getOriginalSlides(track) {
    return Array.from(
      track.querySelectorAll(`[data-slide]:not([${LOOP_CLONE_ATTR}]):not([${DUPLICATE_CLONE_ATTR}])`)
    );
  }

  /** Duplicate each slide once in DOM (for Tilda char limit). Counter still uses originals only. */
  function applyDuplicateSlides(track, sliderRoot) {
    if (sliderRoot.getAttribute('data-swiper-duplicate-slides') !== 'true') return;
    removeDuplicateClones(track);
    const originals = getOriginalSlides(track);
    originals.forEach((slide) => {
      const clone = slide.cloneNode(true);
      clone.setAttribute(DUPLICATE_CLONE_ATTR, 'true');
      clone.removeAttribute('id');
      track.appendChild(clone);
    });
  }

  function countSlidesForLoop(track) {
    return track.querySelectorAll(`[data-slide]:not([${LOOP_CLONE_ATTR}])`).length;
  }

  function measureVisibleSlides(container, slides) {
    if (!slides.length) return 1;

    const containerWidth = container.clientWidth;
    if (!containerWidth) return 1;

    let visible = 0;
    let widthSum = 0;

    for (const slide of slides) {
      let w = slide.getBoundingClientRect().width || slide.offsetWidth;
      if (w <= 0) {
        const style = window.getComputedStyle(slide);
        w = parseFloat(style.width) || parseFloat(style.maxWidth) || parseFloat(style.minWidth) || 0;
      }
      if (w <= 0) continue;
      widthSum += w;
      visible += 1;
      if (widthSum >= containerWidth) break;
    }

    if (!visible) {
      const style = window.getComputedStyle(slides[0]);
      const estSlideWidth =
        parseFloat(style.width) || parseFloat(style.maxWidth) || parseFloat(style.minWidth) || containerWidth;
      return Math.max(1, Math.ceil(containerWidth / Math.max(1, estSlideWidth)));
    }

    return Math.max(1, visible);
  }

  /** Для loop на десктопе: если слайдов мало, добавляем клоны (иначе Swiper loop не включается). */
  function prepareLoopSlides(container, track, sliderRoot, loopRequested) {
    removeLoopClones(track);

    const originals = getOriginalSlides(track);
    const originalCount = originals.length;
    if (!loopRequested || originalCount < 2) {
      return { originalCount, loopEnabled: false };
    }

    const visibleCount = measureVisibleSlides(container, originals);
    const wideSlides = sliderRoot.getAttribute('data-swiper-wide-slides') === 'true';
    const nativeLoopOk = wideSlides || originalCount >= visibleCount * 2;

    if (nativeLoopOk) {
      return { originalCount, loopEnabled: true };
    }

    const minRequired = Math.max(originalCount + 2, visibleCount * 2 + 2);
    let total = countSlidesForLoop(track);
    let cloneIndex = 0;
    while (total < minRequired) {
      const source = originals[cloneIndex % originalCount];
      const clone = source.cloneNode(true);
      clone.setAttribute(LOOP_CLONE_ATTR, 'true');
      clone.removeAttribute('id');
      clone.classList.add('swiper-slide');
      track.appendChild(clone);
      cloneIndex += 1;
      total += 1;
    }

    return { originalCount, loopEnabled: true };
  }

  function loopDisplayIndex(sw, originalCount) {
    if (!originalCount) return 0;
    const raw = typeof sw.realIndex === 'number' ? sw.realIndex : sw.activeIndex;
    return ((raw % originalCount) + originalCount) % originalCount;
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

  function slideIndex(sw, loopEnabled, originalCount) {
    if (loopEnabled && originalCount) return loopDisplayIndex(sw, originalCount);
    return typeof sw.activeIndex === 'number' ? sw.activeIndex : 0;
  }

  function initOne(sliderRoot) {
    if (sliderRoot.id === 'SectionPlans') return null;

    const allScreens = swiperAllScreens(sliderRoot);
    if (!narrowViewport() && !allScreens) return null;
    if (sliderRoot.getAttribute('data-mobile-carousel') !== 'true') return null;
    if ((sliderRoot.getAttribute('data-mode') || '').toLowerCase() !== 'translate') return null;

    const Swiper = getSwiper();
    if (!Swiper) return null;

    const structure = ensureSwiperStructure(sliderRoot);
    if (!structure) return null;

    const { container, track } = structure;
    applyDuplicateSlides(track, sliderRoot);
    const { prevEl, nextEl } = pickVisibleNav(sliderRoot);
    const loop = sliderRoot.getAttribute('data-infinite') === 'true';
    const wideSlides = sliderRoot.getAttribute('data-swiper-wide-slides') === 'true';
    const edgeRaw = sliderRoot.getAttribute('data-swiper-edge');
    const edgeInset = edgeRaw != null && String(edgeRaw).trim() !== '' ? Math.max(0, parseInt(edgeRaw, 10) || 0) : 0;
    const offsetAfterDesktopRaw = sliderRoot.getAttribute('data-swiper-offset-after-desktop');
    const offsetAfterDesktop =
      offsetAfterDesktopRaw != null && String(offsetAfterDesktopRaw).trim() !== '' ? Math.max(0, parseInt(offsetAfterDesktopRaw, 10) || 0) : 0;
    const currentEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-current]'));
    const totalEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-total]'));
    const desktop = !narrowViewport();
    const loopRequested = desktop && loop;
    const { originalCount, loopEnabled } = prepareLoopSlides(container, track, sliderRoot, loopRequested);
    totalEls.forEach((el) => (el.textContent = String(originalCount || 0)));

    if (container.__swiperInstance) return container.__swiperInstance;

    const baseOptions = {
      slidesPerView: 'auto',
      spaceBetween: 0,
      loop: loopEnabled,
      ...(loopEnabled && !wideSlides ? { loopAdditionalSlides: 2 } : {}),
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
          if (loopEnabled && typeof sw.loopFix === 'function') sw.loopFix();
          const index = slideIndex(sw, loopEnabled, originalCount);
          currentEls.forEach((el) => (el.textContent = String(index + 1)));
        },
        slideChange(sw) {
          const index = slideIndex(sw, loopEnabled, originalCount);
          currentEls.forEach((el) => (el.textContent = String(index + 1)));
        },
      },
    };

    if (allScreens) {
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
    removeLoopClones(track);
    removeDuplicateClones(track);
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
