import { applySwiperNavigation, scheduleArendaSwiperBoot } from './arendaSwiperBootstrap.js';

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
    track.style.transform = '';
    track.style.transition = '';
    container.scrollLeft = 0;

    Array.from(track.querySelectorAll(`[data-slide]:not([${LOOP_CLONE_ATTR}])`)).forEach((s) => s.classList.add('swiper-slide'));

    return { container, track };
  }

  const LOOP_CLONE_ATTR = 'data-swiper-loop-clone';
  const DUPLICATE_CLONE_ATTR = 'data-swiper-duplicate-clone';
  const STATIC_DUPLICATE_ATTR = 'data-swiper-static-duplicate';
  const SLIDE_ORDER = [
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth',
    'tenth',
  ];

  function removeLoopClones(track) {
    if (!track) return;
    track.querySelectorAll(`[${LOOP_CLONE_ATTR}]`).forEach((el) => el.remove());
  }

  function removeDuplicateClones(track) {
    if (!track) return;
    track.querySelectorAll(`[${DUPLICATE_CLONE_ATTR}]`).forEach((el) => el.remove());
  }

  function removeNativeSwiperClones(track) {
    if (!track) return;
    track.querySelectorAll('.swiper-slide-duplicate').forEach((el) => el.remove());
  }

  function slideOrderIndex(slide) {
    const index = SLIDE_ORDER.findIndex((className) => slide.classList.contains(className));
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }

  function restoreOriginalSlideOrder(track) {
    if (!track) return;
    const slides = Array.from(
      track.querySelectorAll(
        `[data-slide]:not([${LOOP_CLONE_ATTR}]):not([${DUPLICATE_CLONE_ATTR}]):not([${STATIC_DUPLICATE_ATTR}]):not(.swiper-slide-duplicate)`
      )
    );
    const orderClassCounts = slides.reduce((acc, slide) => {
      const order = slideOrderIndex(slide);
      if (order !== Number.MAX_SAFE_INTEGER) acc.set(order, (acc.get(order) || 0) + 1);
      return acc;
    }, new Map());
    if (Array.from(orderClassCounts.values()).some((count) => count > 1)) return;

    const sorted = slides
      .map((slide, index) => ({ slide, index, order: slideOrderIndex(slide) }))
      .sort((a, b) => a.order - b.order || a.index - b.index);

    const staticDuplicates = Array.from(track.querySelectorAll(`[data-slide][${STATIC_DUPLICATE_ATTR}]`));
    const beforeDuplicates = staticDuplicates.filter((slide) => slide.getAttribute(STATIC_DUPLICATE_ATTR) === 'before');
    const afterDuplicates = staticDuplicates.filter((slide) => slide.getAttribute(STATIC_DUPLICATE_ATTR) !== 'before');

    beforeDuplicates.forEach((slide) => track.appendChild(slide));
    sorted.forEach(({ slide }) => track.appendChild(slide));
    afterDuplicates.forEach((slide) => track.appendChild(slide));
  }

  function getOriginalSlides(track) {
    return Array.from(
      track.querySelectorAll(
        `[data-slide]:not([${LOOP_CLONE_ATTR}]):not([${DUPLICATE_CLONE_ATTR}]):not([${STATIC_DUPLICATE_ATTR}]):not(.swiper-slide-duplicate)`
      )
    );
  }

  function getCounterTotal(sliderRoot, originalCount) {
    const raw = sliderRoot.getAttribute('data-swiper-counter-total');
    if (raw != null && String(raw).trim() !== '') {
      const parsed = parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return originalCount;
  }

  function applyMobileCounterLimit(track, sliderRoot) {
    const raw = sliderRoot.getAttribute('data-swiper-counter-total');
    if (raw == null || String(raw).trim() === '') return;

    const limit = parseInt(raw, 10);
    if (!Number.isFinite(limit) || limit <= 0) return;

    const slides = Array.from(
      track.querySelectorAll(`[data-slide]:not([${LOOP_CLONE_ATTR}]):not([${DUPLICATE_CLONE_ATTR}]):not(.swiper-slide-duplicate)`)
    );

    slides.forEach((slide, index) => {
      slide.style.display = '';
      slide.classList.add('swiper-slide');

      if (narrowViewport() && index >= limit) {
        slide.style.display = 'none';
        slide.classList.remove('swiper-slide');
      }
    });
  }

  /** Keep duplicate/loop clones out of the static start state. */
  function applyDuplicateSlides(track, sliderRoot) {
    removeNativeSwiperClones(track);
    removeDuplicateClones(track);
    restoreOriginalSlideOrder(track);
    applyMobileCounterLimit(track, sliderRoot);
    if (narrowViewport()) {
      track.querySelectorAll(`[${STATIC_DUPLICATE_ATTR}]`).forEach((el) => el.remove());
    }
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

  function swiperAllScreens(sliderRoot) {
    return sliderRoot.getAttribute('data-swiper-all-screens') === 'true';
  }

  function slideIndex(sw, loopEnabled, originalCount, counterTotal = originalCount) {
    if (!counterTotal) return 0;
    if (loopEnabled) return loopDisplayIndex(sw, originalCount) % counterTotal;
    const raw = typeof sw.activeIndex === 'number' ? sw.activeIndex : 0;
    return ((raw % counterTotal) + counterTotal) % counterTotal;
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
    const offsetAfterMobileRaw = sliderRoot.getAttribute('data-swiper-offset-after-mobile');
    const offsetAfterMobile =
      offsetAfterMobileRaw != null && String(offsetAfterMobileRaw).trim() !== '' ? Math.max(0, parseInt(offsetAfterMobileRaw, 10) || 0) : 0;
    const currentEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-current]'));
    const totalEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-total]'));
    const desktop = !narrowViewport();
    const loopRequested = desktop && loop;
    const { originalCount, loopEnabled } = prepareLoopSlides(container, track, sliderRoot, loopRequested);
    const counterTotal = getCounterTotal(sliderRoot, originalCount);
    totalEls.forEach((el) => (el.textContent = String(counterTotal || 0)));

    const existing = container.__swiperInstance;
    if (existing) {
      applySwiperNavigation(existing, prevEl, nextEl);
      if (typeof existing.update === 'function') existing.update();
      return existing;
    }

    const baseOptions = {
      slidesPerView: 'auto',
      initialSlide: 0,
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
      on: {
        init(sw) {
          if (loopEnabled && typeof sw.loopFix === 'function') sw.loopFix();
          const index = slideIndex(sw, loopEnabled, originalCount, counterTotal);
          currentEls.forEach((el) => (el.textContent = String(index + 1)));
        },
        slideChange(sw) {
          const index = slideIndex(sw, loopEnabled, originalCount, counterTotal);
          currentEls.forEach((el) => (el.textContent = String(index + 1)));
        },
      },
    };

    if (prevEl && nextEl) {
      baseOptions.navigation = { prevEl, nextEl };
    }

    if (allScreens) {
      if (!wideSlides) {
        baseOptions.breakpoints = {
          0: {
            spaceBetween: 0,
            ...(offsetAfterDesktop > 0 ? { slidesOffsetAfter: 0 } : {}),
            ...(offsetAfterMobile > 0 ? { slidesOffsetAfter: offsetAfterMobile } : {}),
          },
          1024: {
            spaceBetween: 2,
            ...(offsetAfterDesktop > 0 ? { slidesOffsetAfter: offsetAfterDesktop } : {}),
          },
        };
      } else if (offsetAfterDesktop > 0 || offsetAfterMobile > 0) {
        baseOptions.breakpoints = {
          0: { spaceBetween: 0, slidesOffsetAfter: offsetAfterMobile },
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
    if (inst && typeof inst.destroy === 'function') inst.destroy(true, true);
    if (container) container.__swiperInstance = null;
    if (track) {
      track.style.transform = '';
      track.style.transition = '';
    }
    if (container) container.scrollLeft = 0;
    removeLoopClones(track);
    removeNativeSwiperClones(track);
    removeDuplicateClones(track);
    restoreOriginalSlideOrder(track);
  }

  function initAll() {
    const roots = Array.from(document.querySelectorAll('[data-slider][data-mobile-carousel="true"]'));
    roots.forEach((r) => initOne(r));
  }

  function refreshAll() {
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

  let lastLayoutWidth = window.visualViewport?.width ?? window.innerWidth;
  let resizeRefreshTimer = null;

  function refreshOnResize() {
    clearTimeout(resizeRefreshTimer);
    resizeRefreshTimer = setTimeout(() => {
      const width = window.visualViewport?.width ?? window.innerWidth;
      if (Math.abs(width - lastLayoutWidth) < 2) return;
      lastLayoutWidth = width;
      refreshAll();
    }, 150);
  }

  function refreshOnOrientationChange() {
    lastLayoutWidth = window.visualViewport?.width ?? window.innerWidth;
    clearTimeout(resizeRefreshTimer);
    refreshAll();
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

  scheduleArendaSwiperBoot(initAll);

  window.addEventListener('resize', refreshOnResize);
  window.addEventListener('orientationchange', refreshOnOrientationChange);
})();
