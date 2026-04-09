import "./style.css";
import "../slider.js";
import "./accordion.js";
import "./projectsAnim.js";

const DESIGN_WIDTH = 1440;
const MIN_SCALE_BREAKPOINT = 769; // start scaling at >= 768px viewport width

function supportsZoomProperty() {
  // Not standardized, but widely supported in Chromium-based & Safari; return boolean
  const testEl = document.createElement("div");
  return "zoom" in testEl.style;
}

function applyScale(scale) {
  const container = document.getElementById("scale-container");
  if (!container) return;

  // Prefer native zoom when available for crisper text rendering
  if (supportsZoomProperty()) {
    container.style.zoom = String(scale);
    container.style.transform = "";
    container.style.width = `${DESIGN_WIDTH}px`;
    container.style.marginLeft = "auto";
    container.style.marginRight = "auto";
  } else {
    // Fallback to CSS transform scale with left-center origin and translate to center
    container.style.zoom = "";
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = "top left";
    // When using transform, the visual width is DESIGN_WIDTH * scale; center it
    const viewportWidth = window.innerWidth;
    const visualWidth = DESIGN_WIDTH * scale;
    const leftOffset = Math.max(0, (viewportWidth - visualWidth) / 2);
    container.style.marginLeft = `${leftOffset}px`;
    container.style.marginRight = "0px";
    container.style.width = `${DESIGN_WIDTH}px`;
  }
}

function updateScale() {
  const viewportWidth = window.innerWidth;
  const container = document.getElementById("scale-container");
  const wrapper = document.getElementById("scale-wrapper");
  if (!container || !wrapper) return;

  if (viewportWidth >= MIN_SCALE_BREAKPOINT) {
    const scale = Math.max(viewportWidth / DESIGN_WIDTH, 0.01); // avoid 0
    applyScale(scale);
    wrapper.style.overflowX = "hidden";
  } else {
    // Below 768px: disable scaling and allow your mobile styles to handle layout
    container.style.zoom = "";
    container.style.transform = "";
    container.style.marginLeft = "auto";
    container.style.marginRight = "auto";
    container.style.width = "100%";
  }
}

// Initialize and listen for resize/zoom changes
window.addEventListener("resize", updateScale);
window.addEventListener("orientationchange", updateScale);
document.addEventListener("DOMContentLoaded", updateScale);
updateScale();

// Generic slider implementation (looping, buttons, counter, drag)

function wrapIndex(index, length) {
  if (length === 0) return 0;
  const result = index % length;
  return result < 0 ? result + length : result;
}

function initSliders() {
  const sliderRoots = Array.from(document.querySelectorAll("[data-slider]"));
  sliderRoots.forEach(initSliderInstance);
}

function initSliderInstance(sliderRoot) {
  const mode = (
    sliderRoot.getAttribute("data-mode") || "translate"
  ).toLowerCase();
  const track = sliderRoot.querySelector("[data-track]");
  const initialSlides = track
    ? Array.from(track.querySelectorAll("[data-slide]"))
    : [];
  if (!track || initialSlides.length === 0) return;

  const prevButton = sliderRoot.querySelector("[data-prev]");
  const nextButton = sliderRoot.querySelector("[data-next]");
  const currentEl = sliderRoot.querySelector("[data-counter] [data-current]");
  const totalEl = sliderRoot.querySelector("[data-counter] [data-total]");
  const infinite =
    sliderRoot.getAttribute("data-infinite") === "true" && mode === "translate";

  let currentIndex = 0;
  let translateStepPx = 0; // used in translate mode
  let isDragging = false;
  let dragStartX = 0;
  let dragDeltaX = 0;

  const totalCount = initialSlides.length;
  if (totalEl) totalEl.textContent = String(totalCount);

  const getSlides = () => Array.from(track.querySelectorAll("[data-slide]"));

  function computeStep() {
    if (mode !== "translate") return;
    const liveSlides = Array.from(track.querySelectorAll("[data-slide]"));
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

  function applyFade() {
    const fadeSlides = getSlides();
    fadeSlides.forEach((slideEl, idx) => {
      if (idx === currentIndex) {
        slideEl.style.opacity = "1";
        slideEl.style.pointerEvents = "auto";
        slideEl.style.zIndex = "1";
      } else {
        slideEl.style.opacity = "0";
        slideEl.style.pointerEvents = "none";
        slideEl.style.zIndex = "0";
      }
    });
  }

  function setTransform(x, withTransition = true) {
    if (withTransition) {
      track.style.transition = "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)";
    } else {
      track.style.transition = "none";
    }
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  }

  function applyTranslate(withTransition = true) {
    const baseX = -currentIndex * translateStepPx;
    const x = Math.round(baseX + dragDeltaX);
    setTransform(x, withTransition);
  }

  function updateCounter() {
    if (currentEl) currentEl.textContent = String(currentIndex + 1);
  }

  function goTo(index) {
    currentIndex = wrapIndex(index, totalCount);
    updateCounter();
    if (mode === "fade") {
      applyFade();
    } else {
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
  function handleNextInfinite() {
    if (animating) return;
    animating = true;
    // animate left by one step
    setTransform(-translateStepPx, true);
    const onEnd = () => {
      track.removeEventListener("transitionend", onEnd);
      // rotate first slide to end
      const firstChild = track.querySelector("[data-slide]");
      if (firstChild) track.appendChild(firstChild);
      // reset transform without transition
      setTransform(0, false);
      animating = false;
    };
    track.addEventListener("transitionend", onEnd, { once: true });
    // logical counter update
    currentIndex = wrapIndex(currentIndex + 1, totalCount);
    updateCounter();
  }
  function handlePrevInfinite() {
    if (animating) return;
    animating = true;
    // pre-rotate last to front, jump left, then animate back to 0
    const slideEls = track.querySelectorAll("[data-slide]");
    const lastChild = slideEls[slideEls.length - 1];
    if (lastChild) track.insertBefore(lastChild, track.firstChild);
    setTransform(-translateStepPx, false);
    requestAnimationFrame(() => {
      setTransform(0, true);
      const onEnd = () => {
        track.removeEventListener("transitionend", onEnd);
        animating = false;
      };
      track.addEventListener("transitionend", onEnd, { once: true });
    });
    // logical counter update
    currentIndex = wrapIndex(currentIndex - 1, totalCount);
    updateCounter();
  }

  function onPointerDown(e) {
    if (mode !== "translate") return;
    isDragging = true;
    dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
    dragDeltaX = 0;
    track.style.cursor = "grabbing";
    if (infinite) {
      setTransform(0, false);
    } else {
      applyTranslate(false);
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp, { passive: true });
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    dragDeltaX = x - dragStartX;
    if (infinite) {
      setTransform(dragDeltaX, false);
    } else {
      applyTranslate(false);
    }
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = "";
    const threshold = translateStepPx * 0.25;
    if (infinite) {
      if (dragDeltaX > threshold) {
        handlePrevInfinite();
      } else if (dragDeltaX < -threshold) {
        handleNextInfinite();
      } else {
        setTransform(0, true);
      }
    } else {
      if (dragDeltaX > threshold) {
        handlePrev();
      } else if (dragDeltaX < -threshold) {
        handleNext();
      } else {
        applyTranslate(true);
      }
    }
    dragDeltaX = 0;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("touchmove", onPointerMove);
    window.removeEventListener("touchend", onPointerUp);
  }

  // Resize handling to keep steps accurate in translate mode
  function onResize() {
    if (mode === "translate") {
      computeStep();
      applyTranslate(false);
    }
  }

  // Initial setup
  if (mode === "fade") {
    applyFade();
  } else {
    computeStep();
    if (infinite) {
      setTransform(0, false);
    } else {
      applyTranslate(false);
    }
    // Drag listeners on track for translate mode
    track.addEventListener("pointerdown", onPointerDown, { passive: true });
    track.addEventListener("touchstart", onPointerDown, { passive: true });
  }

  if (prevButton) prevButton.addEventListener("click", handlePrev);
  if (nextButton) nextButton.addEventListener("click", handleNext);
  updateCounter();

  // Keep in sync on resize (after scale updates as well)
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSliders);
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
    body.classList.add("mobile-no-hover");

    // Отключаем hover через обработчик событий (только один раз)
    if (!hoverHandlersAdded) {
      const featureGroups = document.querySelectorAll(".feature.group");
      featureGroups.forEach((group) => {
        const contentDiv = group.querySelector('div[class*="-translate-y-"]');
        const textP = group.querySelector('p[class*="opacity-0"]');

        // Предотвращаем hover эффекты
        group.addEventListener(
          "mouseenter",
          function (e) {
            e.preventDefault();
            e.stopPropagation();
            // Не меняем стили, просто предотвращаем hover
            if (!group.classList.contains("active")) {
              // Оставляем начальное состояние из CSS
              if (contentDiv && contentDiv.style.transform) {
                // Если есть inline стиль от клика, не трогаем его
              } else {
                // Убеждаемся, что нет hover эффекта
                contentDiv.style.transform = "";
              }
            }
          },
          { passive: false }
        );
      });
      hoverHandlersAdded = true;
    }
  } else {
    body.classList.remove("mobile-no-hover");
    hoverHandlersAdded = false;
  }
}

// Обработка клика для feature карточек на мобильных устройствах
let featureClickHandlersInitialized = false;

function initFeatureClickHandlers() {
  // Инициализируем только один раз
  if (featureClickHandlersInitialized) return;

  const featureGroups = document.querySelectorAll(".feature.group");

  featureGroups.forEach((group) => {
    group.addEventListener("click", function () {
      const isMobile = window.innerWidth < 769;
      if (!isMobile) return; // Работает только на мобильных

      const contentDiv = group.querySelector('div[class*="-translate-y-"]');
      const textP = group.querySelector('p[class*="opacity-0"]');

      // Закрываем все остальные карточки
      featureGroups.forEach((otherGroup) => {
        if (otherGroup !== group) {
          otherGroup.classList.remove("active");
          // Возвращаем в видимое состояние
          const otherContentDiv = otherGroup.querySelector(
            'div[class*="-translate-y-"]'
          );
          const otherTextP = otherGroup.querySelector('p[class*="opacity-0"]');
          if (otherContentDiv) {
            otherContentDiv.style.setProperty(
              "transform",
              "translateY(0)",
              "important"
            );
          }
          if (otherTextP) {
            otherTextP.style.setProperty("opacity", "0", "important"); // Текст прозрачный
          }
        }
      });

      // Переключаем текущую карточку
      const isActive = group.classList.toggle("active");

      if (isActive) {
        // Скрываем карточку - двигаем вверх (translateY(-100px))
        if (contentDiv) {
          contentDiv.style.setProperty(
            "transform",
            "translateY(-100px)",
            "important"
          );
        }
        if (textP) {
          textP.style.setProperty("opacity", "1", "important"); // Текст становится видимым
        }
      } else {
        // Показываем карточку - возвращаем в видимое состояние (translateY(0))
        if (contentDiv) {
          contentDiv.style.setProperty(
            "transform",
            "translateY(0)",
            "important"
          );
        }
        if (textP) {
          textP.style.setProperty("opacity", "0", "important"); // Текст прозрачный
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
    const featureGroups = document.querySelectorAll(".feature.group");
    featureGroups.forEach((group) => {
      const contentDiv = group.querySelector('div[class*="-translate-y-"]');
      const textP = group.querySelector('p[class*="opacity-0"]');
      if (contentDiv && !contentDiv.style.transform) {
        // Устанавливаем начальное видимое состояние только если нет inline стилей
        contentDiv.style.setProperty("transform", "translateY(0)", "important");
      }
      if (textP && !textP.style.opacity) {
        textP.style.setProperty("opacity", "0", "important"); // Текст изначально прозрачный
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMobileFeatures);
} else {
  initMobileFeatures();
}

// Переинициализация при изменении размера окна
window.addEventListener("resize", function () {
  disableHoverOnMobile();
});
