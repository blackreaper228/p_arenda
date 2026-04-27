const MOBILE_MAX_WIDTH = 767;

function isMobile() {
  return window.innerWidth <= MOBILE_MAX_WIDTH;
}

function getSwiper() {
  return window.Swiper;
}

function ensureSwiperStructure(sliderRoot) {
  const track = sliderRoot.querySelector('[data-track]');
  if (!track) return null;

  // Use the track parent as the Swiper "container" (it already has overflow-hidden in markup).
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
  // offsetParent is null for display:none (and for fixed in some cases),
  // so also check computed style.
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function pickVisibleNav(sliderRoot) {
  const prevAll = Array.from(sliderRoot.querySelectorAll('[data-prev]'));
  const nextAll = Array.from(sliderRoot.querySelectorAll('[data-next]'));

  const prevEl = prevAll.find(isVisible) || prevAll[0] || null;
  const nextEl = nextAll.find(isVisible) || nextAll[0] || null;

  return { prevEl, nextEl };
}

function initOne(sliderRoot) {
  if (!isMobile()) return null;
  if (sliderRoot.getAttribute('data-mobile-carousel') !== 'true') return null;
  if ((sliderRoot.getAttribute('data-mode') || '').toLowerCase() !== 'translate') return null;

  const Swiper = getSwiper();
  if (!Swiper) return null;

  const structure = ensureSwiperStructure(sliderRoot);
  if (!structure) return null;

  const { container } = structure;
  const { prevEl, nextEl } = pickVisibleNav(sliderRoot);
  const loop = sliderRoot.getAttribute('data-infinite') === 'true';

  // Prevent double init.
  if (container.__swiperInstance) return container.__swiperInstance;

  const instance = new Swiper(container, {
    slidesPerView: 'auto',
    spaceBetween: 0,
    loop,
    speed: 380,
    resistanceRatio: 0.85,
    followFinger: true,
    threshold: 5,
    grabCursor: false,
    preventInteractionOnTransition: false,
    navigation: prevEl && nextEl ? { prevEl, nextEl } : undefined,
  });

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

    if (!isMobile()) {
      if (inst) destroyOne(r);
      return;
    }
    if (!inst) initOne(r);
    else if (typeof inst.update === 'function') inst.update();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}

window.addEventListener('resize', refreshOnResize);
window.addEventListener('orientationchange', refreshOnResize);

