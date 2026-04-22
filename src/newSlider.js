// Mobile-only carousel slider (supports swipe/drag + buttons).
// Opt-in per slider root: add `data-mobile-carousel="true"` on the element with `data-slider`.
//
// Markup expected inside slider root:
// - [data-track] container
// - [data-slide] children inside track
// - optional [data-prev] / [data-next] buttons (can be multiple)
// - optional counter: [data-counter] [data-current] / [data-total]

const MOBILE_MAX_WIDTH = 767;

function isMobile() {
  return window.innerWidth <= MOBILE_MAX_WIDTH;
}

function wrapIndex(index, length) {
  if (length === 0) return 0;
  const result = index % length;
  return result < 0 ? result + length : result;
}

function getStepPx(track) {
  const slides = Array.from(track.querySelectorAll('[data-slide]'));
  if (slides.length <= 1) return slides[0]?.offsetWidth ?? 0;
  const first = slides[0];
  const second = slides[1];
  const delta = second.offsetLeft - first.offsetLeft;
  return delta > 0 ? delta : first.offsetWidth;
}

function setTransform(track, x, withTransition) {
  track.style.transition = withTransition ? 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
  track.style.transform = `translate3d(${Math.round(x)}px, 0, 0)`;
}

/** @type {WeakMap<Element, () => void>} */
const cleanups = new WeakMap();

function destroySlider(sliderRoot) {
  const cleanup = cleanups.get(sliderRoot);
  if (cleanup) cleanup();
  cleanups.delete(sliderRoot);
}

function initSlider(sliderRoot) {
  if (!isMobile()) return;
  if (cleanups.has(sliderRoot)) return;

  const enabled = sliderRoot.getAttribute('data-mobile-carousel') === 'true';
  if (!enabled) return;

  const mode = (sliderRoot.getAttribute('data-mode') || 'translate').toLowerCase();
  if (mode !== 'translate') return;

  const track = sliderRoot.querySelector('[data-track]');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('[data-slide]'));
  if (slides.length === 0) return;

  const prevButtons = Array.from(sliderRoot.querySelectorAll('[data-prev]'));
  const nextButtons = Array.from(sliderRoot.querySelectorAll('[data-next]'));
  const currentEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-current]'));
  const totalEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-total]'));

  const totalCount = slides.length;
  totalEls.forEach((el) => {
    el.textContent = String(totalCount);
  });

  let stepPx = getStepPx(track);
  let currentIndex = 0;
  let animating = false;
  let animTimer = null;
  let pendingAction = null;
  let isDragging = false;
  let startX = 0;
  let deltaX = 0;

  function updateCounter() {
    currentEls.forEach((el) => {
      el.textContent = String(currentIndex + 1);
    });
  }

  function clearAnimTimer() {
    if (animTimer) {
      clearTimeout(animTimer);
      animTimer = null;
    }
  }

  function unlockAnimation() {
    animating = false;
    clearAnimTimer();
    // If user clicked/swiped during animation, run one queued action.
    const queued = pendingAction;
    pendingAction = null;
    if (queued) {
      requestAnimationFrame(() => queued());
    }
  }

  function withAnimationLock(run) {
    if (animating) {
      pendingAction = run;
      return;
    }
    animating = true;

    // Safety net: on some mobile browsers `transitionend` can be missed
    // when users interact quickly. Never let the slider get stuck.
    clearAnimTimer();
    animTimer = setTimeout(() => {
      setTransform(track, 0, false);
      unlockAnimation();
    }, 700);

    run();
  }

  function handleNext() {
    withAnimationLock(() => {
      // ensure we always start from a clean baseline
      if (!stepPx || stepPx <= 0) {
        recompute();
        unlockAnimation();
        return;
      }
      setTransform(track, 0, false);
      requestAnimationFrame(() => {
        setTransform(track, -stepPx, true);
      });

      const onEnd = (e) => {
        if (e && e.target !== track) return;
        track.removeEventListener('transitionend', onEnd);
        track.removeEventListener('transitioncancel', onCancel);
        const firstChild = track.querySelector('[data-slide]');
        if (firstChild) track.appendChild(firstChild);
        setTransform(track, 0, false);
        unlockAnimation();
      };

      const onCancel = (e) => {
        if (e && e.target !== track) return;
        track.removeEventListener('transitionend', onEnd);
        track.removeEventListener('transitioncancel', onCancel);
        setTransform(track, 0, false);
        unlockAnimation();
      };

      track.addEventListener('transitionend', onEnd);
      track.addEventListener('transitioncancel', onCancel);

      currentIndex = wrapIndex(currentIndex + 1, totalCount);
      updateCounter();
    });
  }

  function handlePrev() {
    withAnimationLock(() => {
      if (!stepPx || stepPx <= 0) {
        recompute();
        unlockAnimation();
        return;
      }
      const slideEls = track.querySelectorAll('[data-slide]');
      const lastChild = slideEls[slideEls.length - 1];
      if (lastChild) track.insertBefore(lastChild, track.firstChild);

      setTransform(track, -stepPx, false);
      requestAnimationFrame(() => {
        setTransform(track, 0, true);
      });

      const onEnd = (e) => {
        if (e && e.target !== track) return;
        track.removeEventListener('transitionend', onEnd);
        track.removeEventListener('transitioncancel', onCancel);
        unlockAnimation();
      };

      const onCancel = (e) => {
        if (e && e.target !== track) return;
        track.removeEventListener('transitionend', onEnd);
        track.removeEventListener('transitioncancel', onCancel);
        setTransform(track, 0, false);
        unlockAnimation();
      };

      track.addEventListener('transitionend', onEnd);
      track.addEventListener('transitioncancel', onCancel);

      currentIndex = wrapIndex(currentIndex - 1, totalCount);
      updateCounter();
    });
  }

  function recompute() {
    stepPx = getStepPx(track);
    setTransform(track, 0, false);
  }

  prevButtons.forEach((btn) => btn.addEventListener('click', handlePrev));
  nextButtons.forEach((btn) => btn.addEventListener('click', handleNext));

  function onPointerMove(e) {
    if (!isDragging || animating) return;
    const x = e.clientX;
    deltaX = x - startX;
    setTransform(track, deltaX, false);
  }

  function endDrag() {
    if (!isDragging || animating) return;
    isDragging = false;
    const threshold = Math.max(30, stepPx * 0.25);
    const direction = deltaX > threshold ? 'prev' : deltaX < -threshold ? 'next' : 'snap';

    // Normalize to a clean baseline before triggering the animated step.
    // Without this, on some mobile browsers the next transition may start
    // from a mid-drag transform and visually desync (text "moves" but image seems stuck).
    setTransform(track, 0, false);

    requestAnimationFrame(() => {
      if (direction === 'prev') handlePrev();
      else if (direction === 'next') handleNext();
      else setTransform(track, 0, true);
    });
    deltaX = 0;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
  }

  function onPointerDown(e) {
    if (!isMobile() || animating) return;
    // left mouse only (when emulating mobile in devtools)
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    isDragging = true;
    startX = e.clientX;
    deltaX = 0;
    try {
      track.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setTransform(track, 0, false);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', endDrag, { passive: true });
    window.addEventListener('pointercancel', endDrag, { passive: true });
  }

  // Allow vertical scroll, but enable horizontal swipe for carousel
  track.style.touchAction = 'pan-y';
  track.addEventListener('pointerdown', onPointerDown, { passive: true });

  updateCounter();
  recompute();

  const onResize = () => {
    if (!isMobile()) {
      destroySlider(sliderRoot);
      return;
    }
    recompute();
  };

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  cleanups.set(sliderRoot, () => {
    prevButtons.forEach((btn) => btn.removeEventListener('click', handlePrev));
    nextButtons.forEach((btn) => btn.removeEventListener('click', handleNext));
    track.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    track.style.transition = '';
    track.style.transform = '';
    track.style.touchAction = '';
  });
}

export function initMobileCarousels() {
  const sliderRoots = Array.from(document.querySelectorAll('[data-slider]'));
  sliderRoots.forEach((root) => initSlider(root));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileCarousels);
} else {
  initMobileCarousels();
}
