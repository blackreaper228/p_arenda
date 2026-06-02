/**
 * Tilda / first-paint helpers: wait for Swiper + layout before binding navigation.
 */

export function whenArendaLayoutReady(callback) {
  const run = () => {
    const fontsReady =
      document.fonts && typeof document.fonts.ready !== 'undefined'
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve();
    fontsReady.then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(callback);
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}

export function waitForSwiper(callback, maxAttempts = 80) {
  if (window.Swiper) {
    callback();
    return;
  }
  let attempts = 0;
  const tick = () => {
    if (window.Swiper) {
      callback();
      return;
    }
    if (attempts >= maxAttempts) return;
    attempts += 1;
    setTimeout(tick, 50);
  };
  tick();
}

/** DOMContentLoaded + fonts + rAF; also `load` for first visit when images shift layout. */
export function scheduleArendaSwiperBoot(initFn) {
  whenArendaLayoutReady(() => {
    waitForSwiper(initFn);
  });
  window.addEventListener(
    'load',
    () => {
      waitForSwiper(initFn);
    },
    { once: true }
  );
}

export function applySwiperNavigation(sw, prevEl, nextEl) {
  if (!sw || !prevEl || !nextEl) return false;

  const nav = sw.params.navigation || {};
  if (nav.prevEl === prevEl && nav.nextEl === nextEl && sw.navigation) {
    return true;
  }

  sw.params.navigation = { ...(sw.params.navigation || {}), prevEl, nextEl };

  if (sw.navigation && typeof sw.navigation.destroy === 'function') {
    sw.navigation.destroy();
  }
  if (sw.navigation && typeof sw.navigation.init === 'function') {
    sw.navigation.init();
    if (typeof sw.navigation.update === 'function') sw.navigation.update();
  }

  return true;
}

export function refreshArendaSwipersAfterLayout() {
  if (typeof window.initArendaSwiperCarousel === 'function') {
    window.initArendaSwiperCarousel();
  }
  if (typeof window.initArendaHeroSwiperFade === 'function') {
    window.initArendaHeroSwiperFade();
  }
}
