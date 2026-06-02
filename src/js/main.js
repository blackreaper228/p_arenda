import '../style.css';
import '../responsive.css';
import './slider.js';
import './accordion.js';
import './projectsAnim.js';
import './textSlider.js';
import './swiperMobileCarousels.js';
import { refreshArendaSwipersAfterLayout } from './arendaSwiperBootstrap.js';
import './adminka.js';
import './customScroll.js';
import './scrollToTop.js';

const DESIGN_WIDTH = 1440;
const MIN_SCALE_BREAKPOINT = 769; // start scaling at >= 768px viewport width
let lastScaleRefreshWidth = null;

function supportsZoomProperty() {
  // Not standardized, but widely supported in Chromium-based & Safari; return boolean
  const testEl = document.createElement('div');
  return 'zoom' in testEl.style;
}

function applyScale(scale) {
  const container = document.getElementById('scale-container');
  if (!container) return;

  // Prefer native zoom when available for crisper text rendering
  if (supportsZoomProperty()) {
    container.style.zoom = String(scale);
    container.style.transform = '';
    container.style.width = `${DESIGN_WIDTH}px`;
    container.style.marginLeft = 'auto';
    container.style.marginRight = 'auto';
  } else {
    // Fallback to CSS transform scale with left-center origin and translate to center
    container.style.zoom = '';
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = 'top left';
    // When using transform, the visual width is DESIGN_WIDTH * scale; center it
    const viewportWidth = window.innerWidth;
    const visualWidth = DESIGN_WIDTH * scale;
    const leftOffset = Math.max(0, (viewportWidth - visualWidth) / 2);
    container.style.marginLeft = `${leftOffset}px`;
    container.style.marginRight = '0px';
    container.style.width = `${DESIGN_WIDTH}px`;
  }
}

function updateScale() {
  const viewportWidth = window.innerWidth;
  const container = document.getElementById('scale-container');
  const wrapper = document.getElementById('scale-wrapper');
  if (!container || !wrapper) return;
  const shouldRefreshSwipers = lastScaleRefreshWidth == null || Math.abs(viewportWidth - lastScaleRefreshWidth) >= 2;
  lastScaleRefreshWidth = viewportWidth;

  if (viewportWidth >= MIN_SCALE_BREAKPOINT) {
    const scale = Math.max(viewportWidth / DESIGN_WIDTH, 0.01); // avoid 0
    applyScale(scale);
    wrapper.style.overflowX = 'hidden';
  } else {
    // Below 768px: disable scaling and allow your mobile styles to handle layout
    container.style.zoom = '';
    container.style.transform = '';
    container.style.marginLeft = 'auto';
    container.style.marginRight = 'auto';
    container.style.width = '100%';
  }

  if (shouldRefreshSwipers) {
    requestAnimationFrame(() => refreshArendaSwipersAfterLayout());
  }
}

// Initialize and listen for resize/zoom changes
window.addEventListener('resize', updateScale);
window.addEventListener('orientationchange', updateScale);
document.addEventListener('DOMContentLoaded', updateScale);
updateScale();

// Generic slider implementation (looping, buttons, counter, drag)

function wrapIndex(index, length) {
  if (length === 0) return 0;
  const result = index % length;
  return result < 0 ? result + length : result;
}

function initSliders() {
  const sliderRoots = Array.from(document.querySelectorAll('[data-slider]'));
  sliderRoots.forEach(initSliderInstance);
}

function initSliderInstance(sliderRoot) {
  const mode = (sliderRoot.getAttribute('data-mode') || 'translate').toLowerCase();
  const swiperAllScreens =
    sliderRoot.getAttribute('data-mobile-carousel') === 'true' && mode === 'translate' && sliderRoot.getAttribute('data-swiper-all-screens') === 'true';
  // Swiper owns translate carousels with `data-swiper-all-screens` (all viewports) or mobile-only carousels.
  if (swiperAllScreens) return;
  if (window.innerWidth < 768 && sliderRoot.getAttribute('data-mobile-carousel') === 'true' && mode === 'translate') {
    if (sliderRoot.id !== 'SectionPlans') return;
  }
  const track = sliderRoot.querySelector('[data-track]');
  const initialSlides = track ? Array.from(track.querySelectorAll('[data-slide]')) : [];
  if (!track || initialSlides.length === 0) return;

  const isPlansSlider = sliderRoot.id === 'SectionPlans';

  function isPlansMobileNow() {
    return isPlansSlider && window.innerWidth < 768;
  }

  const prevButtons = Array.from(sliderRoot.querySelectorAll('[data-prev]'));
  const nextButtons = Array.from(sliderRoot.querySelectorAll('[data-next]'));
  const currentEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-current]'));
  const totalEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-total]'));
  const infinite =
    sliderRoot.getAttribute('data-infinite') === 'true' && mode === 'translate' && !isPlansMobileNow();

  let currentIndex = 0;
  let translateStepPx = 0; // used in translate mode
  let isDragging = false;
  let dragStartX = 0;
  let dragDeltaX = 0;

  const totalCount = initialSlides.length;
  totalEls.forEach((el) => {
    el.textContent = String(totalCount);
  });

  const getSlides = () => Array.from(track.querySelectorAll('[data-slide]'));

  function computeStep() {
    if (mode !== 'translate') return;
    const liveSlides = Array.from(track.querySelectorAll('[data-slide]'));
    if (isPlansMobileNow()) {
      const cw = translateContainer()?.clientWidth || liveSlides[0]?.offsetWidth || 0;
      translateStepPx = cw;
      return;
    }
    if (liveSlides.length <= 1) {
      translateStepPx = liveSlides[0].offsetWidth;
      return;
    }
    const first = liveSlides[0];
    const second = liveSlides[1];
    const firstLeft = first.offsetLeft;
    const secondLeft = second.offsetLeft;
    const delta = secondLeft - firstLeft;
    translateStepPx = delta > 0 ? delta : first.offsetWidth;
  }

  /** Left edge of slide relative to the track's content box (walk offsetParent chain). */
  function slideLeftInTrack(slide) {
    let x = 0;
    let node = slide;
    while (node && node !== track) {
      x += node.offsetLeft;
      node = node.offsetParent;
    }
    if (node !== track) {
      const tr = track.getBoundingClientRect();
      const sr = slide.getBoundingClientRect();
      return sr.left - tr.left;
    }
    return x;
  }

  function translateContainer() {
    return track.parentElement;
  }

  /** Max scroll so the right end of the track aligns with the right edge of the visible container. */
  function maxTranslateX() {
    const container = translateContainer();
    const cw = container ? container.clientWidth : track.clientWidth;
    return Math.max(0, track.scrollWidth - cw);
  }

  function applyFade() {
    const fadeSlides = getSlides();
    fadeSlides.forEach((slideEl, idx) => {
      if (idx === currentIndex) {
        slideEl.style.opacity = '1';
        slideEl.style.pointerEvents = 'auto';
        slideEl.style.zIndex = '1';
      } else {
        slideEl.style.opacity = '0';
        slideEl.style.pointerEvents = 'none';
        slideEl.style.zIndex = '0';
      }
    });
  }

  const PLANS_SNAP_MS = 220;
  const SNAP_MS = 400;
  const SNAP_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

  function snapDurationMs() {
    return isPlansSlider ? PLANS_SNAP_MS : SNAP_MS;
  }

  function clearTransition() {
    track.style.transition = 'none';
  }

  function enableSnapTransition() {
    track.style.transition = `transform ${snapDurationMs()}ms ${SNAP_EASING}`;
  }

  function setTransform(x, withTransition = true) {
    track.style.transform = `translate3d(${Math.round(x)}px, 0, 0)`;
    if (withTransition) enableSnapTransition();
  }

  function applyTransformX(x, withTransition = true) {
    if (withTransition) {
      setTransform(x, true);
    } else {
      track.style.transform = `translate3d(${Math.round(x)}px, 0, 0)`;
    }
  }

  function computeTranslateX() {
    if (infinite) return -currentIndex * translateStepPx;
    if (isPlansMobileNow()) {
      const last = Math.max(0, totalCount - 1);
      const clamped = Math.max(0, Math.min(last, currentIndex));
      const baseX = -clamped * translateStepPx;
      const xRaw = Math.round(baseX + dragDeltaX);
      const minX = -last * translateStepPx;
      return Math.min(0, Math.max(minX, xRaw));
    }
    const liveSlides = getSlides();
    if (liveSlides.length === 0) return 0;
    const last = liveSlides.length - 1;
    const clamped = Math.max(0, Math.min(last, currentIndex));
    let baseX;
    if (clamped === last) {
      baseX = -maxTranslateX();
    } else {
      baseX = -slideLeftInTrack(liveSlides[clamped]);
    }
    const xRaw = Math.round(baseX + dragDeltaX);
    const m = maxTranslateX();
    return Math.min(0, Math.max(-m, xRaw));
  }

  function applyTranslate(withTransition = true) {
    applyTransformX(computeTranslateX(), withTransition);
  }

  function updateCounter() {
    currentEls.forEach((el) => {
      el.textContent = String(currentIndex + 1);
    });
  }

  function goTo(index) {
    if (!infinite) {
      currentIndex = Math.max(0, Math.min(totalCount - 1, index));
    } else {
      currentIndex = wrapIndex(index, totalCount);
    }
    updateCounter();
    if (mode === 'fade') {
      applyFade();
    } else {
      if (isPlansMobileNow()) computeStep();
      applyTranslate(true);
    }
  }

  // Non-infinite handlers fallback to index-based movement
  function handlePrev() {
    if (infinite) return handlePrevInfinite();
    goTo(currentIndex - 1);
  }
  function handleNext() {
    if (infinite) return handleNextInfinite();
    goTo(currentIndex + 1);
  }

  // Infinite carousel via DOM rotation
  let animating = false;
  let animatingDir = null;
  let infiniteTransitionEnd = null;

  function clearInfiniteAnimation() {
    if (!animating) return;
    if (infiniteTransitionEnd) {
      track.removeEventListener('transitionend', infiniteTransitionEnd);
      infiniteTransitionEnd = null;
    }
    clearTransition();
    if (animatingDir === 'next') {
      const firstChild = track.querySelector('[data-slide]');
      if (firstChild) track.appendChild(firstChild);
    }
    track.style.transform = 'translate3d(0, 0, 0)';
    animating = false;
    animatingDir = null;
  }

  function handleNextInfinite() {
    if (animating) {
      clearInfiniteAnimation();
      currentIndex = wrapIndex(currentIndex + 1, totalCount);
      updateCounter();
      return;
    }
    animating = true;
    animatingDir = 'next';
    currentIndex = wrapIndex(currentIndex + 1, totalCount);
    updateCounter();
    enableSnapTransition();
    track.style.transform = `translate3d(${-translateStepPx}px, 0, 0)`;
    infiniteTransitionEnd = () => {
      infiniteTransitionEnd = null;
      const firstChild = track.querySelector('[data-slide]');
      if (firstChild) track.appendChild(firstChild);
      clearTransition();
      track.style.transform = 'translate3d(0, 0, 0)';
      animating = false;
      animatingDir = null;
    };
    track.addEventListener('transitionend', infiniteTransitionEnd, { once: true });
  }

  function handlePrevInfinite() {
    if (animating) {
      clearInfiniteAnimation();
      const slideEls = track.querySelectorAll('[data-slide]');
      const lastChild = slideEls[slideEls.length - 1];
      if (lastChild) track.insertBefore(lastChild, track.firstChild);
      clearTransition();
      track.style.transform = 'translate3d(0, 0, 0)';
      currentIndex = wrapIndex(currentIndex - 1, totalCount);
      updateCounter();
      return;
    }
    animating = true;
    animatingDir = 'prev';
    const slideEls = track.querySelectorAll('[data-slide]');
    const lastChild = slideEls[slideEls.length - 1];
    if (lastChild) track.insertBefore(lastChild, track.firstChild);
    clearTransition();
    track.style.transform = `translate3d(${-translateStepPx}px, 0, 0)`;
    currentIndex = wrapIndex(currentIndex - 1, totalCount);
    updateCounter();
    requestAnimationFrame(() => {
      enableSnapTransition();
      track.style.transform = 'translate3d(0, 0, 0)';
      infiniteTransitionEnd = () => {
        infiniteTransitionEnd = null;
        animating = false;
        animatingDir = null;
      };
      track.addEventListener('transitionend', infiniteTransitionEnd, { once: true });
    });
  }

  function onPointerDown(e) {
    if (mode !== 'translate') return;
    if (window.innerWidth < 768 && !isPlansMobileNow()) return;
    if (infinite && animating) clearInfiniteAnimation();
    isDragging = true;
    dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
    dragDeltaX = 0;
    track.style.cursor = 'grabbing';
    clearTransition();
    if (infinite) {
      track.style.transform = 'translate3d(0, 0, 0)';
    } else if (isPlansSlider) {
      applyTransformX(computeTranslateX(), false);
    } else {
      applyTranslate(false);
    }
    if (e.pointerId !== undefined && track.setPointerCapture) {
      try {
        track.setPointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    if (!isPlansSlider) {
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp, { passive: true });
    }
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    dragDeltaX = x - dragStartX;
    if (infinite) {
      track.style.transform = `translate3d(${Math.round(dragDeltaX)}px, 0, 0)`;
    } else if (isPlansSlider) {
      track.style.transform = `translate3d(${computeTranslateX()}px, 0, 0)`;
    } else {
      applyTranslate(false);
    }
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = '';
    if (e?.pointerId !== undefined && track.releasePointerCapture) {
      try {
        track.releasePointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
    }
    if (isPlansMobileNow()) computeStep();
    const threshold = translateStepPx * 0.25;
    const delta = dragDeltaX;
    dragDeltaX = 0;
    if (infinite) {
      if (delta > threshold) {
        handlePrevInfinite();
      } else if (delta < -threshold) {
        handleNextInfinite();
      } else {
        setTransform(0, true);
      }
    } else {
      if (delta > threshold) {
        handlePrev();
      } else if (delta < -threshold) {
        handleNext();
      } else {
        applyTranslate(true);
      }
    }
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    if (!isPlansSlider) {
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    }
  }

  // Resize handling to keep steps accurate in translate mode
  function onResize() {
    if (mode === 'translate') {
      computeStep();
      applyTranslate(false);
    }
  }

  // Initial setup
  if (mode === 'fade') {
    applyFade();
  } else {
    computeStep();
    if (infinite) {
      setTransform(0, false);
    } else {
      applyTranslate(false);
    }
    // Drag listeners on track for translate mode
    track.addEventListener('pointerdown', onPointerDown, { passive: true });
    if (!isPlansSlider) {
      track.addEventListener('touchstart', onPointerDown, { passive: true });
    }
    if (isPlansSlider) track.style.touchAction = 'pan-y';
  }

  prevButtons.forEach((btn) => btn.addEventListener('click', handlePrev));
  nextButtons.forEach((btn) => btn.addEventListener('click', handleNext));
  updateCounter();

  // Keep in sync on resize (after scale updates as well)
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSliders);
} else {
  initSliders();
}

// Отключение hover эффектов на мобильных устройствах
let hoverHandlersAdded = false;

function disableHoverOnMobile() {
  const isMobile = window.innerWidth < 769;
  const body = document.body;

  if (isMobile) {
    // Добавляем класс для отключения hover на мобильных
    body.classList.add('mobile-no-hover');

    // Отключаем hover через обработчик событий (только один раз)
    if (!hoverHandlersAdded) {
      const featureGroups = document.querySelectorAll('.feature.group');
      featureGroups.forEach((group) => {
        const contentDiv = group.querySelector('div[class*="-translate-y-"]');
        const textP = group.querySelector('p[class*="opacity-0"]');

        // Предотвращаем hover эффекты
        group.addEventListener(
          'mouseenter',
          function (e) {
            e.preventDefault();
            e.stopPropagation();
            // Не меняем стили, просто предотвращаем hover
            if (!group.classList.contains('active')) {
              // Оставляем начальное состояние из CSS
              if (contentDiv && contentDiv.style.transform) {
                // Если есть inline стиль от клика, не трогаем его
              } else {
                // Убеждаемся, что нет hover эффекта
                contentDiv.style.transform = '';
              }
            }
          },
          { passive: false }
        );
      });
      hoverHandlersAdded = true;
    }
  } else {
    body.classList.remove('mobile-no-hover');
    hoverHandlersAdded = false;
  }
}

// Обработка клика для feature карточек на мобильных устройствах
let featureClickHandlersInitialized = false;

function initFeatureClickHandlers() {
  // Инициализируем только один раз
  if (featureClickHandlersInitialized) return;

  const featureGroups = document.querySelectorAll('.feature.group');

  featureGroups.forEach((group) => {
    group.addEventListener('click', function () {
      const isMobile = window.innerWidth < 769;
      if (!isMobile) return; // Работает только на мобильных

      const contentDiv = group.querySelector('div[class*="-translate-y-"]');
      const textP = group.querySelector('p[class*="opacity-0"]');

      // Закрываем все остальные карточки
      featureGroups.forEach((otherGroup) => {
        if (otherGroup !== group) {
          otherGroup.classList.remove('active');
          // Возвращаем в видимое состояние
          const otherContentDiv = otherGroup.querySelector('div[class*="-translate-y-"]');
          const otherTextP = otherGroup.querySelector('p[class*="opacity-0"]');
          if (otherContentDiv) {
            otherContentDiv.style.setProperty('transform', 'translateY(0)', 'important');
          }
          if (otherTextP) {
            otherTextP.style.setProperty('opacity', '0', 'important'); // Текст прозрачный
          }
        }
      });

      // Переключаем текущую карточку
      const isActive = group.classList.toggle('active');

      if (isActive) {
        // Скрываем карточку - двигаем вверх (translateY(-100px))
        if (contentDiv) {
          contentDiv.style.setProperty('transform', 'translateY(-100px)', 'important');
        }
        if (textP) {
          textP.style.setProperty('opacity', '1', 'important'); // Текст становится видимым
        }
      } else {
        // Показываем карточку - возвращаем в видимое состояние (translateY(0))
        if (contentDiv) {
          contentDiv.style.setProperty('transform', 'translateY(0)', 'important');
        }
        if (textP) {
          textP.style.setProperty('opacity', '0', 'important'); // Текст прозрачный
        }
      }
    });
  });

  featureClickHandlersInitialized = true;
}

// Инициализация при загрузке
function initMobileFeatures() {
  disableHoverOnMobile();
  initFeatureClickHandlers();

  // Устанавливаем начальное состояние всех карточек на мобильных
  const isMobile = window.innerWidth < 769;
  if (isMobile) {
    const featureGroups = document.querySelectorAll('.feature.group');
    featureGroups.forEach((group) => {
      const contentDiv = group.querySelector('div[class*="-translate-y-"]');
      const textP = group.querySelector('p[class*="opacity-0"]');
      if (contentDiv && !contentDiv.style.transform) {
        // Устанавливаем начальное видимое состояние только если нет inline стилей
        contentDiv.style.setProperty('transform', 'translateY(0)', 'important');
      }
      if (textP && !textP.style.opacity) {
        textP.style.setProperty('opacity', '0', 'important'); // Текст изначально прозрачный
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileFeatures);
} else {
  initMobileFeatures();
}

// Переинициализация при изменении размера окна
window.addEventListener('resize', function () {
  disableHoverOnMobile();
});
