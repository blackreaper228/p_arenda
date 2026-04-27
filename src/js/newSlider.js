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

function isIOSSafari() {
  const ua = navigator.userAgent || '';
  const isIOS = /iP(hone|ad|od)/.test(ua);
  const isWebKit = /WebKit/i.test(ua);
  const isNotOtherIOSBrowser = !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
  // iOS browsers are WebKit, but we want to target Safari-like transition quirks.
  return isIOS && isWebKit && isNotOtherIOSBrowser;
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
  track.style.transition = withTransition ? 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
  // Avoid rounding during gesture moves: it causes visible "stepping" on mobile.
  const value = withTransition ? Math.round(x) : x;
  track.style.transform = `translate3d(${value}px, 0, 0)`;
}

function forceReflow(el) {
  // iOS Safari can "skip" transitions if style changes are batched.
  // A read forces it to commit the previous style before animating.
  void el.offsetHeight;
}

function animateTransform(track, fromX, toX) {
  setTransform(track, fromX, false);
  forceReflow(track);
  requestAnimationFrame(() => {
    setTransform(track, toX, true);
  });
}

function preloadSlideAssets(slideEl) {
  if (!slideEl) return;

  // Common lazy-loading patterns used by sliders/landing pages.
  // We keep this defensive and no-op if attributes don't exist.
  const sources = Array.from(slideEl.querySelectorAll('source'));
  sources.forEach((s) => {
    const ds = s.getAttribute('data-srcset');
    if (ds && !s.getAttribute('srcset')) s.setAttribute('srcset', ds);
  });

  const imgs = Array.from(slideEl.querySelectorAll('img'));
  imgs.forEach((img) => {
    // Hint the browser to fetch now.
    try {
      if (img.loading === 'lazy') img.loading = 'eager';
    } catch {
      // ignore
    }

    const dataSrc = img.getAttribute('data-src');
    if (dataSrc && (!img.getAttribute('src') || img.getAttribute('src') === '')) {
      img.setAttribute('src', dataSrc);
    }

    const dataSrcset = img.getAttribute('data-srcset');
    if (dataSrcset && !img.getAttribute('srcset')) img.setAttribute('srcset', dataSrcset);

    // Kick decode so the image is ready by the time it becomes visible.
    // Some browsers throw if decode is called too early; ignore.
    try {
      if (typeof img.decode === 'function') img.decode().catch(() => {});
    } catch {
      // ignore
    }
  });
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
  /** @type {Array<() => void>} */
  let actionQueue = [];
  /** @type {null | 'next' | 'prev'} */
  let queuedType = null;
  let lastNavTs = 0;
  let isDragging = false;
  let startX = 0;
  let deltaX = 0;
  let rafDrag = 0;
  let pendingDragX = 0;
  let dragPrepared = false;
  let dragPrependedEl = null;
  /** @type {null | { type: 'next' | 'prev'; settled: boolean }} */
  let inFlight = null;
  /** @type {null | (() => void)} */
  let activeSettle = null;
  /** @type {null | ((e: TransitionEvent) => void)} */
  let activeOnEnd = null;
  /** @type {null | ((e: TransitionEvent) => void)} */
  let activeOnCancel = null;

  function unbindTransitionHandlers() {
    if (activeOnEnd) track.removeEventListener('transitionend', activeOnEnd);
    if (activeOnCancel) track.removeEventListener('transitioncancel', activeOnCancel);
    activeOnEnd = null;
    activeOnCancel = null;
  }

  function bindTransitionHandlers(onEnd, onCancel) {
    unbindTransitionHandlers();
    activeOnEnd = onEnd;
    activeOnCancel = onCancel;
    track.addEventListener('transitionend', onEnd);
    track.addEventListener('transitioncancel', onCancel);
  }

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
    inFlight = null;
    activeSettle = null;
    unbindTransitionHandlers();
    // If user clicked/swiped during animation, run queued actions in order.
    const queued = actionQueue.shift();
    queuedType = null;
    if (queued) requestAnimationFrame(queued);
  }

  function withAnimationLock(run) {
    if (animating) {
      // Coalesce rapid inputs: keep only the latest action.
      // Otherwise spamming buttons creates a long backlog of animations.
      actionQueue[0] = run;
      return;
    }
    animating = true;

    // Safety net: on some mobile browsers `transitionend` can be missed
    // when users interact quickly. Never let the slider get stuck.
    clearAnimTimer();
    run();
  }

  function handleNext(startOffsetX = 0) {
    withAnimationLock(() => {
      // ensure we always start from a clean baseline
      if (!stepPx || stepPx <= 0) {
        recompute();
        unlockAnimation();
        return;
      }
      inFlight = { type: 'next', settled: false };

      // After "next", the visible slide becomes the current second slide.
      // Preload it so we don't see a blank while the image loads.
      const slideElsBefore = track.querySelectorAll('[data-slide]');
      preloadSlideAssets(slideElsBefore[1] || slideElsBefore[0]);

      const settleNext = () => {
        if (!inFlight || inFlight.type !== 'next' || inFlight.settled) return;
        inFlight.settled = true;
        const firstChild = track.querySelector('[data-slide]');
        if (firstChild) track.appendChild(firstChild);
        setTransform(track, 0, false);
        track.style.willChange = '';
        // Also preload the new "next" slide after rotation.
        const slideElsAfter = track.querySelectorAll('[data-slide]');
        preloadSlideAssets(slideElsAfter[1] || slideElsAfter[0]);
        unlockAnimation();
      };
      activeSettle = settleNext;

      // Start from current gesture offset (if any) to avoid a visual "snap back" to 0.
      track.style.willChange = 'transform';
      animateTransform(track, startOffsetX, -stepPx);

      const onEnd = (e) => {
        if (e && e.target !== track) return;
        if (e && e.propertyName && e.propertyName !== 'transform') return;
        unbindTransitionHandlers();
        settleNext();
      };

      const onCancel = (e) => {
        if (e && e.target !== track) return;
        // iOS Safari can emit `transitioncancel` mid-flight spuriously, which causes a visible "teleport"
        // when we settle (DOM rotation + transform reset). Prefer timeout/transitionend there.
        if (isIOSSafari()) return;
        unbindTransitionHandlers();
        // If the transition was canceled, still settle to keep logical & visual state in sync.
        settleNext();
      };

      bindTransitionHandlers(onEnd, onCancel);

      // Safety net: on some mobile browsers `transitionend` can be missed.
      // If that happens, we still need to rotate DOM (otherwise the slider "sticks" on the same slide).
      clearAnimTimer();
      animTimer = setTimeout(() => {
        settleNext();
      }, 400);

      currentIndex = wrapIndex(currentIndex + 1, totalCount);
      updateCounter();
    });
  }

  function handlePrev(startOffsetX = 0) {
    withAnimationLock(() => {
      if (!stepPx || stepPx <= 0) {
        recompute();
        unlockAnimation();
        return;
      }
      inFlight = { type: 'prev', settled: false };

      const settlePrev = () => {
        if (!inFlight || inFlight.type !== 'prev' || inFlight.settled) return;
        inFlight.settled = true;
        setTransform(track, 0, false);
        track.style.willChange = '';
        unlockAnimation();
      };
      activeSettle = settlePrev;

      const onEnd = (e) => {
        if (e && e.target !== track) return;
        if (e && e.propertyName && e.propertyName !== 'transform') return;
        unbindTransitionHandlers();
        settlePrev();
      };

      const onCancel = (e) => {
        if (e && e.target !== track) return;
        if (isIOSSafari()) return;
        unbindTransitionHandlers();
        settlePrev();
      };

      bindTransitionHandlers(onEnd, onCancel);

      const doPrependLast = () => {
        const slideEls = track.querySelectorAll('[data-slide]');
        const lastChild = slideEls[slideEls.length - 1];
        preloadSlideAssets(lastChild);
        if (lastChild) track.insertBefore(lastChild, track.firstChild);
      };

      if (startOffsetX) {
        // When swiping back, we're currently at `startOffsetX`.
        // Prepending changes layout; adjust transform by `-stepPx` in the same frame
        // so the user doesn't see a snap and we keep the transition intact.
        setTransform(track, startOffsetX, false);
        requestAnimationFrame(() => {
          doPrependLast();
          setTransform(track, startOffsetX - stepPx, false);
          forceReflow(track);
          requestAnimationFrame(() => {
            track.style.willChange = 'transform';
            setTransform(track, 0, true);
          });
        });
      } else {
        // Button click: start from the canonical baseline `-stepPx` then animate to 0.
        doPrependLast();
        track.style.willChange = 'transform';
        animateTransform(track, -stepPx, 0);
      }

      clearAnimTimer();
      animTimer = setTimeout(() => {
        settlePrev();
      }, 800);

      currentIndex = wrapIndex(currentIndex - 1, totalCount);
      updateCounter();
    });
  }

  function recompute() {
    stepPx = getStepPx(track);
    setTransform(track, 0, false);
  }

  function nav(type) {
    const now = Date.now();
    // Hard throttle for click-spam (esp. iOS Safari can choke on bursts of events).
    if (now - lastNavTs < 120) return;
    lastNavTs = now;

    if (animating) {
      // If the same direction is already queued, ignore extra clicks.
      if (queuedType === type) return;
      queuedType = type;
      withAnimationLock(() => (type === 'next' ? handleNext(0) : handlePrev(0)));
      return;
    }
    queuedType = null;
    type === 'next' ? handleNext(0) : handlePrev(0);
  }

  prevButtons.forEach((btn) =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      nav('prev');
    })
  );
  nextButtons.forEach((btn) =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      nav('next');
    })
  );

  function prepareDragLoop() {
    if (dragPrepared) return;
    if (!stepPx || stepPx <= 0) recompute();

    // Make previous slide exist to the left during drag:
    // move last -> first, then offset by -stepPx so the visible slide doesn't change.
    const slideEls = track.querySelectorAll('[data-slide]');
    const lastChild = slideEls[slideEls.length - 1];
    if (lastChild) {
      preloadSlideAssets(lastChild);
      track.insertBefore(lastChild, track.firstChild);
      dragPrependedEl = lastChild;
      setTransform(track, -stepPx, false);
      dragPrepared = true;
    }
  }

  function cleanupDragLoop() {
    dragPrepared = false;
    dragPrependedEl = null;
  }

  function onPointerMove(e) {
    if (!isDragging || animating) return;
    const x = e.clientX;
    deltaX = x - startX;
    pendingDragX = deltaX;
    if (rafDrag) return;
    rafDrag = requestAnimationFrame(() => {
      rafDrag = 0;
      // During drag we keep the "current" slide aligned at -stepPx baseline.
      // This allows dragging both directions without blank space.
      setTransform(track, -stepPx + pendingDragX, false);
    });
  }

  function endDrag() {
    if (!isDragging || animating) return;
    isDragging = false;
    if (rafDrag) {
      cancelAnimationFrame(rafDrag);
      rafDrag = 0;
    }
    const threshold = Math.max(30, stepPx * 0.25);
    const direction = deltaX > threshold ? 'prev' : deltaX < -threshold ? 'next' : 'snap';

    withAnimationLock(() => {
      // We'll drive the transition ourselves since drag uses a different baseline (-stepPx).
      inFlight = { type: direction === 'snap' ? 'next' : direction, settled: false };

      const settle = () => {
        if (!inFlight || inFlight.settled) return;
        inFlight.settled = true;
        unbindTransitionHandlers();
        clearAnimTimer();

        if (direction === 'prev') {
          // After animating to 0, the first slide is the previous one (already in place).
          setTransform(track, 0, false);
          currentIndex = wrapIndex(currentIndex - 1, totalCount);
          updateCounter();
          cleanupDragLoop();
          track.style.willChange = '';
          unlockAnimation();
          return;
        }

        if (direction === 'next') {
          // At -2*stepPx we show the next slide (which is currently the 3rd item).
          // Normalize: move the prepended slide back to end, then rotate "next" (move first to end).
          const first = track.querySelector('[data-slide]');
          if (first) track.appendChild(first); // move prepended back
          const newFirst = track.querySelector('[data-slide]');
          if (newFirst) track.appendChild(newFirst); // rotate next
          setTransform(track, 0, false);
          currentIndex = wrapIndex(currentIndex + 1, totalCount);
          updateCounter();
          cleanupDragLoop();
          track.style.willChange = '';
          unlockAnimation();
          return;
        }

        // snap
        if (dragPrepared && dragPrependedEl) {
          // undo the temporary prepend
          const first = track.querySelector('[data-slide]');
          if (first) track.appendChild(first);
        }
        setTransform(track, 0, false);
        cleanupDragLoop();
        track.style.willChange = '';
        unlockAnimation();
      };
      activeSettle = settle;

      const onEnd = (e) => {
        if (e && e.target !== track) return;
        if (e && e.propertyName && e.propertyName !== 'transform') return;
        settle();
      };
      const onCancel = (e) => {
        if (e && e.target !== track) return;
        if (isIOSSafari()) return;
        settle();
      };

      bindTransitionHandlers(onEnd, onCancel);

      // Animate from current drag position (-stepPx + deltaX) to target.
      const fromX = -stepPx + deltaX;
      const toX = direction === 'prev' ? 0 : direction === 'next' ? -2 * stepPx : -stepPx;
      track.style.willChange = 'transform';
      animateTransform(track, fromX, toX);

      clearAnimTimer();
      animTimer = setTimeout(() => {
        settle();
      }, 800);
    });

    deltaX = 0;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
  }

  function onPointerDown(e) {
    if (!isMobile()) return;
    // left mouse only (when emulating mobile in devtools)
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Allow "grabbing" the slider while it is still animating (PIK-like behavior).
    // We finish/cancel the current animation immediately so drag can start right away.
    if (animating && activeSettle) activeSettle();
    isDragging = true;
    prepareDragLoop();
    startX = e.clientX;
    deltaX = 0;
    try {
      track.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    // Drag baseline is -stepPx (see prepareDragLoop).
    setTransform(track, -stepPx, false);
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
    if (rafDrag) cancelAnimationFrame(rafDrag);
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
