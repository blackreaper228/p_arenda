/**
 * Unified plain JS for Tilda / rent.parametr.space/test.
 * Generated from src/js-test/main.js imports. Do not paste ES module import/export lines into Tilda.
 * Requires Swiper to be loaded before this script.
 */

// ===== src/js/arendaSwiperBootstrap.js =====
/**
 * Tilda / first-paint helpers: wait for Swiper + layout before binding navigation.
 */

function whenArendaLayoutReady(callback) {
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

function waitForSwiper(callback, maxAttempts = 80) {
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
function scheduleArendaSwiperBoot(initFn) {
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

function applySwiperNavigation(sw, prevEl, nextEl) {
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

function refreshArendaSwipersAfterLayout() {
  if (typeof window.initArendaSwiperCarousel === 'function') {
    window.initArendaSwiperCarousel();
  }
  if (typeof window.initArendaHeroSwiperFade === 'function') {
    window.initArendaHeroSwiperFade();
  }
}

// ===== src/js/slider.js =====
document.addEventListener('DOMContentLoaded', () => {
  const offersContainer = document.querySelector('.W_Offers');
  const offers = document.querySelectorAll('.W_Offer');
  const totalOffers = offers.length;
  let currentIndex = 0;

  const leftArrow = document.querySelector('.U_LeftOffer');
  const rightArrow = document.querySelector('.U_RightOffer');

  // Update the mobile counter
  const currentCountElement = document.querySelector('.A_Mobilecount.U_Dynamic');
  const totalCountElement = document.querySelector('.A_Mobilecount:last-child');
  // totalCountElement.textContent = totalOffers;

  // If this slider markup isn't present on the page, do nothing.
  if (!offersContainer || totalOffers === 0 || !leftArrow || !rightArrow || !currentCountElement || !totalCountElement) {
    return;
  }

  totalCountElement.textContent = String(totalOffers);

  // Function to get the width of a slide including gap
  const getSlideWidth = () => {
    const slide = offers[0];
    const slideWidth = slide.getBoundingClientRect().width;
    const containerStyles = window.getComputedStyle(offersContainer);
    const gapWidth = parseFloat(containerStyles.columnGap || containerStyles.gap || 0);
    return slideWidth + gapWidth;
  };

  const updateSliderPosition = () => {
    const slideWidth = getSlideWidth();
    const translateX = -(currentIndex * slideWidth);
    offersContainer.style.transform = `translateX(${translateX}px)`;
    currentCountElement.textContent = currentIndex + 1;
  };

  rightArrow.addEventListener('click', () => {
    if (currentIndex < totalOffers - 1) {
      currentIndex++;
      updateSliderPosition();
    }
  });

  leftArrow.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateSliderPosition();
    }
  });

  // Optional: Update slide width on window resize
  window.addEventListener('resize', updateSliderPosition);
});

// ===== src/js-test/accordion-test.js =====
/**
 * Копия src/js/accordion.js для блока «Доступные лоты» (financeProgram).
 * Редактируйте этот файл в test.html; index.html использует оригинал в src/js/accordion.js.
 *
 * Десктоп: клик по всей строке .financeProgram (#secondAccordion, #lastAccordion, #balashikhaAccordion).
 * Мобилка (<768px): клик только по #accordionCardMobile*; панели #list* скрыты.
 */
document.addEventListener('DOMContentLoaded', () => {
  const accordions = [document.getElementById('secondAccordion'), document.getElementById('lastAccordion'), document.getElementById('balashikhaAccordion')];
  const mobileTriggers = [
    {
      trigger: document.getElementById('accordionCardMobileSenkino'),
      acc: document.getElementById('secondAccordion'),
    },
    {
      trigger: document.getElementById('accordionCardMobileKuvekino'),
      acc: document.getElementById('lastAccordion'),
    },
    {
      trigger: document.getElementById('accordionCardMobileBalashikha'),
      acc: document.getElementById('balashikhaAccordion'),
    },
  ];
  const listSenkino = document.getElementById('listSenkino');
  const listKuvekino = document.getElementById('listKuvekino');
  const listBalashikha = document.getElementById('listBalashikha');
  const closeListSenk = document.getElementById('closeListSenk');
  const closeListKuv = document.getElementById('closeListKuv');
  const closeListBal = document.getElementById('closeListBal');

  closeListSenk?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAll();
  });

  closeListKuv?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAll();
  });

  closeListBal?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAll();
  });

  function hideLists() {
    listSenkino?.classList.add('hidden');
    listKuvekino?.classList.add('hidden');
    listBalashikha?.classList.add('hidden');
  }

  function showListForAccordion(acc) {
    // On mobile (< 768px) do not show popups at all
    if (window.innerWidth < 768) {
      hideLists();
      return;
    }
    hideLists();
    if (!acc) return;
    if (acc.id === 'secondAccordion') listSenkino?.classList.remove('hidden');
    if (acc.id === 'lastAccordion') listKuvekino?.classList.remove('hidden');
    if (acc.id === 'balashikhaAccordion') listBalashikha?.classList.remove('hidden');
  }

  const LOT_SELECT_GREY = 'var(--grey)';
  const LOT_SELECT_DEFAULT = 'var(--white)';

  function getLotSelectControls(acc) {
    if (!acc) return null;
    const header = acc.querySelector('[id^="accordionCardMobile"]');
    if (!header) return null;
    return {
      desktop: header.querySelector('.max-md\\:hidden'),
      mobile: header.querySelector('.max-md\\:flex.w-\\[22px\\]'),
    };
  }

  function applyLotSelectColor(el, active) {
    if (!el) return;
    const color = active ? LOT_SELECT_GREY : LOT_SELECT_DEFAULT;
    el.style.color = color;
    el.querySelectorAll('path').forEach((path) => {
      path.setAttribute('fill', color);
    });
  }

  function setMobileChevronActive(el, active) {
    if (!el) return;
    el.classList.toggle('sales-acc-chevron-open', active);
  }

  function setLotSelectActive(acc, active) {
    const controls = getLotSelectControls(acc);
    if (!controls) return;
    applyLotSelectColor(controls.desktop, active);
    setMobileChevronActive(controls.mobile, active);
  }

  function initMobileChevrons() {
    accordions.forEach((acc) => {
      const mobile = getLotSelectControls(acc)?.mobile;
      if (!mobile) return;
      mobile.classList.add('sales-acc-chevron');
      mobile.style.color = '';
      mobile.querySelectorAll('path').forEach((path) => {
        path.setAttribute('fill', 'white');
      });
    });
  }

  function getAccordionStack() {
    return accordions[0]?.parentElement ?? null;
  }

  function prepareAccordionLayout(activeAcc) {
    if (window.innerWidth < 768) return;

    const lotsPic = document.querySelector('#Sales .lotsPic');
    const leftCol = lotsPic?.firstElementChild;
    const stack = getAccordionStack();
    if (!lotsPic || !leftCol || !stack) return;

    leftCol.style.height = '100%';
    leftCol.style.minHeight = '0';
    leftCol.style.display = 'flex';
    leftCol.style.flexDirection = 'column';

    stack.style.flex = '1 1 auto';
    stack.style.minHeight = '0';
    stack.style.height = '100%';
    stack.style.display = 'flex';
    stack.style.flexDirection = 'column';

    accordions.forEach((acc) => {
      if (!acc) return;
      acc.style.display = 'flex';
      acc.style.flexDirection = 'column';
      acc.style.minHeight = '0';
      acc.style.flex = acc === activeAcc ? '1 1 0%' : '0 0 auto';

      const inner = acc.firstElementChild;
      if (!inner) return;

      if (acc === activeAcc) {
        inner.style.height = '100%';
        inner.style.minHeight = '0';
        inner.style.display = 'flex';
        inner.style.flexDirection = 'column';
        inner.style.flex = '1 1 auto';
      } else {
        inner.style.height = '';
        inner.style.minHeight = '';
        inner.style.display = '';
        inner.style.flexDirection = '';
        inner.style.flex = '';
      }
    });
  }

  function resetAccordionLayout() {
    const lotsPic = document.querySelector('#Sales .lotsPic');
    const leftCol = lotsPic?.firstElementChild;
    const stack = getAccordionStack();

    [leftCol, stack].forEach((el) => {
      if (!el) return;
      el.style.height = '';
      el.style.minHeight = '';
      el.style.display = '';
      el.style.flexDirection = '';
      el.style.flex = '';
    });

    accordions.forEach((acc) => {
      if (!acc) return;
      acc.style.flex = '';
      acc.style.minHeight = '';
      acc.style.display = '';
      acc.style.flexDirection = '';

      const inner = acc.firstElementChild;
      if (inner) {
        inner.style.height = '';
        inner.style.minHeight = '';
        inner.style.display = '';
        inner.style.flexDirection = '';
        inner.style.flex = '';
      }
    });
  }

  function stretchAccordionContent(card) {
    const content = card.querySelector(':scope > .flex.flex-col');
    if (!content) return;
    content.style.flex = '1 1 auto';
    content.style.minHeight = '100%';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
  }

  function resetAccordionContent(card) {
    const content = card?.querySelector(':scope > .flex.flex-col');
    if (!content) return;
    content.style.flex = '';
    content.style.minHeight = '';
    content.style.display = '';
    content.style.flexDirection = '';
  }

  function getAvailableHeightPx(acc, card) {
    if (window.innerWidth < 768) {
      const wrap = card.parentElement;
      if (!wrap) return card.scrollHeight;

      const siblingsHeight = Array.from(wrap.children)
        .filter((el) => el !== card)
        .reduce((sum, el) => sum + el.offsetHeight, 0);

      return Math.max(0, wrap.clientHeight - siblingsHeight) || card.scrollHeight;
    }

    const stack = getAccordionStack();
    if (!stack) return card.scrollHeight;

    const stackHeight = stack.getBoundingClientRect().height;
    let othersHeight = 0;

    accordions.forEach((other) => {
      if (!other || other === acc) return;
      othersHeight += other.getBoundingClientRect().height;
    });

    const header = acc.querySelector('[id^="accordionCardMobile"]');
    const headerHeight = header?.offsetHeight ?? 0;
    const available = stackHeight - othersHeight - headerHeight;

    return Math.max(available, card.scrollHeight);
  }

  function closeAll() {
    hideLists();
    accordions.forEach((acc) => {
      if (!acc) return;
      const card = acc.querySelector('.accordionCard');
      if (!card) return;

      // чтобы закрытие тоже анимировалось: сначала фиксируем текущую высоту в px
      card.style.maxHeight = card.offsetHeight + 'px';
      // затем в следующий кадр схлопываем до 0
      requestAnimationFrame(() => {
        card.style.maxHeight = '0px';
      });

      card.style.height = '';
      card.style.flex = '';
      card.style.minHeight = '';
      resetAccordionContent(card);
      const wrap = card.parentElement;
      if (wrap) wrap.style.height = '';

      acc.style.flex = '';
      acc.classList.remove('prior');
      card.classList.remove('is-open');
      setLotSelectActive(acc, false);
    });

    resetAccordionLayout();
  }

  function openCard(acc, card) {
    if (!acc) return;
    showListForAccordion(acc);
    card.classList.add('is-open');
    acc.classList.add('prior');
    setLotSelectActive(acc, true);
    prepareAccordionLayout(acc);

    const wrap = card.parentElement;
    if (wrap) wrap.style.height = '100%';

    card.style.flex = '1 1 0%';
    card.style.minHeight = '0';
    card.style.maxHeight = '0px';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = getAvailableHeightPx(acc, card);
        card.style.maxHeight = `${target}px`;
      });
    });

    const onEnd = (e) => {
      if (e.propertyName !== 'max-height') return;
      card.removeEventListener('transitionend', onEnd);
      if (!card.classList.contains('is-open')) return;
      card.style.flex = '1 1 auto';
      card.style.height = '100%';
      card.style.maxHeight = 'none';
      stretchAccordionContent(card);
    };
    card.addEventListener('transitionend', onEnd);
  }

  // начальное состояние
  initMobileChevrons();
  closeAll();

  // клики
  const isMobile = () => window.innerWidth < 768;

  // Desktop: click on whole row is OK
  accordions.forEach((acc) => {
    if (!acc) return;
    acc.addEventListener('click', () => {
      if (isMobile()) return;
      const card = acc.querySelector('.accordionCard');
      if (!card) return;

      const wasOpen = card.classList.contains('is-open');
      closeAll();
      if (!wasOpen) openCard(acc, card);
    });
  });

  // Mobile: only click on small header blocks
  mobileTriggers.forEach(({ trigger, acc }) => {
    if (!trigger || !acc) return;
    trigger.addEventListener('click', (e) => {
      if (!isMobile()) return;
      e.stopPropagation();
      const card = acc.querySelector('.accordionCard');
      if (!card) return;

      const wasOpen = card.classList.contains('is-open');
      closeAll();
      if (!wasOpen) openCard(acc, card);
    });
  });

  window.addEventListener('resize', () => {
    const openAcc = accordions.find((acc) => acc?.querySelector('.accordionCard.is-open'));
    if (!openAcc || isMobile()) return;

    const card = openAcc.querySelector('.accordionCard');
    if (!card) return;

    prepareAccordionLayout(openAcc);

    if (card.style.maxHeight === 'none') {
      card.style.height = '100%';
      stretchAccordionContent(card);
      return;
    }

    const target = getAvailableHeightPx(openAcc, card);
    card.style.maxHeight = `${target}px`;
  });
});

// ===== src/js/projectsAnim.js =====
// Обработка клика на .plus для мобильных устройств (< 768px)
let projectClickHandlersInitialized = false;

function initProjectClickHandlers() {
  // Инициализируем только один раз
  if (projectClickHandlersInitialized) return;

  const projects = document.querySelectorAll('.project');

  projects.forEach((project) => {
    const plusButton = project.querySelector('.growing');

    if (!plusButton) return;

    plusButton.addEventListener('click', function (e) {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) return; // Работает только на мобильных

      // Предотвращаем переход по ссылке родительского элемента
      e.preventDefault();
      e.stopPropagation();

      // Закрываем все остальные проекты
      projects.forEach((otherProject) => {
        if (otherProject !== project) {
          otherProject.classList.remove('active');
        }
      });

      // Переключаем текущий проект
      project.classList.toggle('active');
    });
  });

  projectClickHandlersInitialized = true;
}

// Инициализация обработчиков кликов для проектов
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectClickHandlers);
} else {
  initProjectClickHandlers();
}

// Переинициализация при изменении размера окна для проектов
window.addEventListener('resize', function () {
  const isMobile = window.innerWidth < 768;

  // Если переключились на десктоп, убираем все активные классы
  if (!isMobile) {
    const projects = document.querySelectorAll('.project.active');
    projects.forEach((project) => {
      project.classList.remove('active');
    });
  }
});

// ===== src/js/textSlider.js =====
// слайдер текста
document.addEventListener('DOMContentLoaded', function () {
  // Находим основной контейнер слайдера
  const mainSlider = document.querySelector('.main-slider');

  if (!mainSlider) return;
  if (mainSlider.closest('[data-swiper-fade="true"]')) return;

  // Находим элементы внутри этого контейнера
  const textSlides = mainSlider.querySelectorAll('[data-text-slide]');
  const nextBtn = mainSlider.querySelector('[data-next]');
  const prevBtn = mainSlider.querySelector('[data-prev]');
  const currentCounter = mainSlider.querySelector('[data-current]');
  const totalCounter = mainSlider.querySelector('[data-total]');

  if (!textSlides.length) return;

  let currentSlide = 0;

  // Функция обновления слайдов
  function updateTextSlides() {
    // Обновляем видимость слайдов
    textSlides.forEach((slide, index) => {
      if (index === currentSlide) {
        slide.classList.remove('hidden');
      } else {
        slide.classList.add('hidden');
      }
    });

    // Обновляем счетчик, если он есть
    if (currentCounter) {
      currentCounter.textContent = currentSlide + 1;
    }

    if (totalCounter) {
      totalCounter.textContent = textSlides.length;
    }
  }

  // Функция для перехода к следующему слайду
  function goToNextSlide() {
    currentSlide = (currentSlide + 1) % textSlides.length;
    updateTextSlides();
  }

  // Функция для перехода к предыдущему слайду
  function goToPrevSlide() {
    currentSlide = (currentSlide - 1 + textSlides.length) % textSlides.length;
    updateTextSlides();
  }

  // Вешаем обработчики на кнопки
  if (nextBtn) {
    nextBtn.addEventListener('click', function (e) {
      e.stopPropagation(); // Останавливаем всплытие
      goToNextSlide();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function (e) {
      e.stopPropagation(); // Останавливаем всплытие
      goToPrevSlide();
    });
  }

  // Добавляем тач-свайп поддержку для мобильных
  let touchStartX = 0;
  let touchEndX = 0;

  const textSliderContainer = mainSlider.querySelector('.text-slider-container');
  if (textSliderContainer) {
    textSliderContainer.addEventListener(
      'touchstart',
      function (e) {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );

    textSliderContainer.addEventListener(
      'touchend',
      function (e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      },
      { passive: true }
    );
  }

  function handleSwipe() {
    const swipeThreshold = 50; // Минимальное расстояние свайпа

    if (touchEndX < touchStartX - swipeThreshold) {
      // Свайп влево = следующий слайд
      goToNextSlide();
    }

    if (touchEndX > touchStartX + swipeThreshold) {
      // Свайп вправо = предыдущий слайд
      goToPrevSlide();
    }
  }

  // Инициализация
  updateTextSlides();
});

// ===== src/js/swiperMobileCarousels.js =====

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

    getOriginalSlides(track).forEach((s) => s.classList.add('swiper-slide'));

    return { container, track };
  }

  const LOOP_CLONE_ATTR = 'data-swiper-loop-clone';
  const DUPLICATE_CLONE_ATTR = 'data-swiper-duplicate-clone';
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
        `[data-slide]:not([${LOOP_CLONE_ATTR}]):not([${DUPLICATE_CLONE_ATTR}]):not(.swiper-slide-duplicate)`
      )
    );
    const sorted = slides
      .map((slide, index) => ({ slide, index, order: slideOrderIndex(slide) }))
      .sort((a, b) => a.order - b.order || a.index - b.index);

    sorted.forEach(({ slide }) => track.appendChild(slide));
  }

  function getOriginalSlides(track) {
    return Array.from(
      track.querySelectorAll(
        `[data-slide]:not([${LOOP_CLONE_ATTR}]):not([${DUPLICATE_CLONE_ATTR}]):not(.swiper-slide-duplicate)`
      )
    );
  }

  /** Keep duplicate/loop clones out of the static start state. */
  function applyDuplicateSlides(track, sliderRoot) {
    removeNativeSwiperClones(track);
    removeDuplicateClones(track);
    restoreOriginalSlideOrder(track);
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

  function slideIndex(sw, loopEnabled, originalCount) {
    if (!originalCount) return 0;
    if (loopEnabled) return loopDisplayIndex(sw, originalCount);
    const raw = typeof sw.activeIndex === 'number' ? sw.activeIndex : 0;
    return ((raw % originalCount) + originalCount) % originalCount;
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
    const duplicateSlides = desktop && sliderRoot.getAttribute('data-swiper-duplicate-slides') === 'true';
    const loopRequested = desktop && loop && !duplicateSlides;
    const { originalCount, loopEnabled } = prepareLoopSlides(container, track, sliderRoot, loopRequested);
    totalEls.forEach((el) => (el.textContent = String(originalCount || 0)));

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
          const index = slideIndex(sw, loopEnabled, originalCount);
          currentEls.forEach((el) => (el.textContent = String(index + 1)));
        },
        slideChange(sw) {
          const index = slideIndex(sw, loopEnabled, originalCount);
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

// ===== src/js-test/swiperHeroFade.js =====

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
    const loopEnabled = slidesCount >= 2;

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

    const baseOptions = {
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
      on: {
        init(sw) {
          syncFromSwiper(sw);
        },
        slideChange(sw) {
          syncFromSwiper(sw);
        },
      },
    };

    if (prevEl && nextEl) {
      baseOptions.navigation = { prevEl, nextEl };
    }

    const instance = new Swiper(container, baseOptions);

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

// ===== src/js-test/adminka-test.js =====
/**
 * Копия src/js/adminka.js — загрузка лотов из Google Sheets в #lotsSenkino / #lotsKuvekino / #lotsBalashikha.
 * Редактируйте для test.html; index.html использует оригинал в src/js/adminka.js.
 */
const SHEET_ID = '1LOblzC-SLe_VW_aleIceVwIXtcRWy-Q3-wrT3IELeLQ';

// If your 2nd sheet has a different gid, set it here (take from the Google Sheets URL: `...gid=XXXX`).
// Many files use gid=0 for the first sheet, and another long number for the second.
const SENKINO_GID = 0;
const KUVEKINO_GID = 1742138652; // <-- change to your real gid if needed
const KUVEKINO_SHEET_NAME = 'Кувекино'; // fallback if gid is unknown/changes
const BALASHIKHA_GID = 1735689882; // <-- set to the gid of the 3rd sheet
const BALASHIKHA_SHEET_NAME = 'Балашиха';

function buildCsvUrls({ gid, sheetName }) {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;
  const urls = [];

  if (typeof gid === 'number') {
    urls.push(`${base}/export?format=csv&gid=${gid}`);
    urls.push(`${base}/gviz/tq?tqx=out:csv&gid=${gid}`);
  }

  if (sheetName) {
    const s = encodeURIComponent(sheetName);
    // `sheet=` works for export in many cases (especially for "Publish to web" CSV)
    urls.push(`${base}/export?format=csv&sheet=${s}`);
    urls.push(`${base}/gviz/tq?tqx=out:csv&sheet=${s}`);
  }

  // last-resort (may return the first sheet)
  urls.push(`${base}/export?format=csv`);
  urls.push(`${base}/gviz/tq?tqx=out:csv`);

  return urls;
}

let allData = [];
let sheetHeaders = [];
const DESKTOP_INITIAL_ROWS = 5;
let visibleRows = DESKTOP_INITIAL_ROWS;

let allDataKuvekino = [];
let sheetHeadersKuvekino = [];
let visibleRowsKuvekino = DESKTOP_INITIAL_ROWS;

let allDataBalashikha = [];
let sheetHeadersBalashikha = [];
let visibleRowsBalashikha = DESKTOP_INITIAL_ROWS;
const rowsPerPage = 6;

const sortState = {
  senkino: { col: null, dir: 'desc' },
  kuvekino: { col: null, dir: 'desc' },
  balashikha: { col: null, dir: 'desc' },
};

function parseAreaToNumber(value) {
  // examples: "1 021 м²", "228", "580 м²"
  const s = String(value ?? '')
    .replaceAll('\u00A0', ' ') // nbsp
    .replaceAll('м²', '')
    .replaceAll('м2', '')
    .replaceAll('㎡', '')
    .trim();
  const digits = s.replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = Number.parseFloat(digits);
  return Number.isFinite(n) ? n : null;
}

function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'ru', { numeric: true, sensitivity: 'base' });
}

function getSortValue(row, colIndex) {
  if (colIndex === 0) return parseAreaToNumber(row.area) ?? row.area;
  if (colIndex === 1) return row.date;
  return row.docks;
}

function sortLotsData(data, state, colIndex) {
  const nextDir = state.col === colIndex ? (state.dir === 'asc' ? 'desc' : 'asc') : 'desc';
  state.col = colIndex;
  state.dir = nextDir;

  const dirMul = nextDir === 'asc' ? 1 : -1;
  return [...data].sort((ra, rb) => {
    const a = getSortValue(ra, colIndex);
    const b = getSortValue(rb, colIndex);
    return compareValues(a, b) * dirMul;
  });
}

function setupSortableHeaderRow(headerRowEl, tableKey, onSort) {
  if (!headerRowEl) return;
  if (headerRowEl.dataset.sortBound === 'true') return;
  headerRowEl.dataset.sortBound = 'true';

  const ps = Array.from(headerRowEl.querySelectorAll('p'));
  ps.forEach((p, idx) => {
    p.dataset.sortCol = String(idx);
    p.classList.add('cursor-pointer', 'select-none', 'hover:opacity-50');
  });

  headerRowEl.addEventListener('click', (e) => {
    const p = e.target?.closest?.('p');
    if (!p) return;
    const col = Number(p.dataset.sortCol);
    if (!Number.isFinite(col)) return;
    onSort(tableKey, col);
  });
}

let sortDelegationBound = false;
function bindSortDelegation() {
  if (sortDelegationBound) return;
  sortDelegationBound = true;

  document.addEventListener('click', (e) => {
    const p = e.target?.closest?.('p');
    if (!p) return;

    // Only sort when clicking inside a designated header row.
    const header = p.closest('[data-lots-header="true"]');
    if (!header) return;

    const ps = Array.from(header.querySelectorAll('p'));
    const colIndex = ps.indexOf(p);
    if (colIndex < 0) return;

    if (header.closest('#lotsSenkino') || header.closest('#lotsSenkinoMobile')) {
      onSort('senkino', colIndex);
    } else if (header.closest('#lotsKuvekino') || header.closest('#lotsKuvekinoMobile')) {
      onSort('kuvekino', colIndex);
    }
  });
}

function markLotsHeaderRow(wrapperEl) {
  if (!wrapperEl) return;
  const firstRow = wrapperEl.firstElementChild;
  if (!firstRow) return;
  firstRow.dataset.lotsHeader = 'true';
}

function updateShowMoreButtonSenkino() {
  const btn = document.getElementById('showMoreSenkino');
  if (!btn) return;

  const shouldShow = allData.length > visibleRows;
  btn.classList.toggle('hidden', !shouldShow);
}

function updateShowMoreButtonKuvekino() {
  const btn = document.getElementById('showMoreKuvekino');
  if (!btn) return;

  const shouldShow = allDataKuvekino.length > visibleRowsKuvekino;
  btn.classList.toggle('hidden', !shouldShow);
}

function updateShowMoreButtonBalashikha() {
  const btn = document.getElementById('showMoreBalashikha');
  if (!btn) return;

  const shouldShow = allDataBalashikha.length > visibleRowsBalashikha;
  btn.classList.toggle('hidden', !shouldShow);
}

async function fetchTableData({ gid, sheetName }) {
  const CSV_URLS = buildCsvUrls({ gid, sheetName });
  for (let i = 0; i < CSV_URLS.length; i++) {
    const url = CSV_URLS[i];

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/csv,text/plain,*/*',
        },
        mode: 'cors',
        redirect: 'follow',
      });

      if (!response.ok) continue;

      const csvText = await response.text();

      if (!csvText || csvText.trim().length === 0) continue;

      if (csvText.trim().startsWith('<')) continue;

      const parsed = parseCSV(csvText);

      if (parsed.data.length > 0) {
        return parsed;
      }
    } catch (error) {
      continue;
    }
  }

  return { headers: [], data: [] };
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');

  if (lines.length === 0) return { headers: [], data: [] };

  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.some((value) => value.trim() !== '')) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }

  return { headers, data };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function formatTableData(data) {
  const norm = (s) =>
    String(s ?? '')
      .trim()
      .toLowerCase();

  function pick(row, variants) {
    const keys = Object.keys(row);
    for (const v of variants) {
      const wanted = norm(v);
      const match = keys.find((k) => norm(k) === wanted);
      if (match) return row[match] || '';
    }
    return '';
  }

  return data.map((row) => {
    const keys = Object.keys(row);

    // Lots таблица (3 колонки): площадь / дата доступа / тип погрузки
    const lotsArea = pick(row, ['площадь', 'площадь помещения', 'area']) || row[keys[0]] || '';
    const lotsDate = pick(row, ['дата доступа', 'дата', 'date']) || row[keys[1]] || '';
    const lotsType = pick(row, ['тип погрузки', 'тип', 'погрузка', 'loading']) || row[keys[2]] || '';

    return {
      // сохраняем имена полей, которые использует рендер `#lotsSenkino`
      area: lotsArea,
      date: lotsDate,
      docks: lotsType,

      // остальные поля оставляем на будущее (если понадобится другая таблица)
      building: pick(row, ['здание', 'building']) || row[keys[0]] || '',
      parking: pick(row, ['парковка', 'parking']) || row[keys[3]] || '',
      price: pick(row, ['стоимость', 'цена', 'price']) || row[keys[5]] || '',
    };
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function applyLotsHeaders(headers) {
  const normalized = (headers || []).filter((h) => String(h ?? '').trim() !== '');
  if (normalized.length === 0) return;

  const [h1, h2, h3] = normalized;

  // Desktop header inside #lotsSenkino
  const desktopHeaderRow = document.querySelector('#lotsSenkino > div > div');
  if (desktopHeaderRow) {
    const ps = Array.from(desktopHeaderRow.querySelectorAll('p'));
    if (ps[0] && h1) ps[0].textContent = h1;
    if (ps[1] && h2) ps[1].textContent = h2;
    if (ps[2] && h3) ps[2].textContent = h3;
  }

  // Mobile header inside #lotsSenkinoMobile
  const mobileHeaderRow = document.querySelector('#lotsSenkinoMobile .listLots > div');
  if (mobileHeaderRow) {
    const ps = Array.from(mobileHeaderRow.querySelectorAll('p'));
    if (ps[0] && h1) ps[0].textContent = h1;
    if (ps[1] && h2) ps[1].textContent = h2;
    if (ps[2] && h3) ps[2].textContent = h3;
  }
}

function createLotsRow({ area, date, docks }) {
  // Структура и классы должны соответствовать `#lotsSenkino` в index.html:
  // 3 колонки: площадь / дата доступа / тип погрузки
  return `
    <div class="flex justify-between py-[24px] border-b border-[var(--stroke-light)]">
      <p class="text-[13px] text-[var(--pikBlack)] uppercase w-full">${escapeHtml(area)}</p>
      <p class="text-[13px] text-[var(--pikBlack)] uppercase w-[124px] shrink-0">${escapeHtml(date)}</p>
      <p class="text-[13px] text-[var(--pikBlack)] uppercase w-full text-right">${escapeHtml(docks)}</p>
    </div>
  `;
}

function createLotsRowMobile({ area, date, docks }, { isLast }) {
  // Структура и классы должны соответствовать `#lotsSenkinoMobile` в index.html:
  // 3 колонки: площадь / дата доступа / тип погрузки
  const borderClass = isLast ? '' : ' border-b border-[var(--stroke-light)]';
  return `
    <div class="flex justify-between py-[15px]${borderClass}">
      <p class="text-[13px] text-[var(--pikBlack)] uppercase w-[112px] shrink-0">${escapeHtml(area)}</p>
      <p class="text-[13px] text-[var(--pikBlack)] uppercase w-full">${escapeHtml(date)}</p>
      <p class="text-[13px] text-[var(--pikBlack)] uppercase w-full text-right">${escapeHtml(docks)}</p>
    </div>
  `;
}

function renderLotsSenkino(data) {
  const container = document.getElementById('lotsSenkino');
  if (!container) return;

  // Внутри `#lotsSenkino` первая строка — это хедер (уже в HTML). Его оставляем.
  // Всё остальное пересобираем из данных.
  const headerRow = container.querySelector(':scope > div > div');
  const wrapper = container.querySelector(':scope > div');
  if (!wrapper) return;

  const visibleData = data.slice(0, visibleRows);

  // Собираем только строки, без изменения хедера.
  const rowsHtml = visibleData.map(createLotsRow).join('');

  if (headerRow) {
    wrapper.innerHTML = headerRow.outerHTML + rowsHtml;
  } else {
    wrapper.innerHTML = rowsHtml;
  }

  markLotsHeaderRow(wrapper);
  updateShowMoreButtonSenkino();

  // header row is re-created via innerHTML, so re-bind sorting after render
  setupSortableHeaderRow(document.querySelector('#lotsSenkino > div > div'), 'senkino', onSort);
}

function renderLotsSenkinoMobile(data) {
  const container = document.getElementById('lotsSenkinoMobile');
  if (!container) return;

  // Внутри `#lotsSenkinoMobile` первая строка — это хедер (уже в HTML). Его оставляем.
  // Всё остальное пересобираем из данных.
  const headerRow = container.querySelector(':scope > div > div');
  const wrapper = container.querySelector(':scope > div');
  if (!wrapper) return;

  const rowsHtml = data.map((row, idx) => createLotsRowMobile(row, { isLast: idx === data.length - 1 })).join('');
  if (headerRow) {
    wrapper.innerHTML = headerRow.outerHTML + rowsHtml;
  } else {
    wrapper.innerHTML = rowsHtml;
  }

  markLotsHeaderRow(wrapper);
  setupSortableHeaderRow(document.querySelector('#lotsSenkinoMobile .listLots > div'), 'senkino', onSort);
}

function renderLotsKuvekino(data) {
  const container = document.getElementById('lotsKuvekino');
  if (!container) return;

  const headerRow = container.querySelector(':scope > div > div');
  const wrapper = container.querySelector(':scope > div');
  if (!wrapper) return;

  const visibleData = data.slice(0, visibleRowsKuvekino);
  const rowsHtml = visibleData.map(createLotsRow).join('');

  if (headerRow) {
    wrapper.innerHTML = headerRow.outerHTML + rowsHtml;
  } else {
    wrapper.innerHTML = rowsHtml;
  }

  markLotsHeaderRow(wrapper);
  updateShowMoreButtonKuvekino();

  setupSortableHeaderRow(document.querySelector('#lotsKuvekino > div > div'), 'kuvekino', onSort);
}

function renderLotsKuvekinoMobile(data) {
  const container = document.getElementById('lotsKuvekinoMobile');
  if (!container) return;

  const headerRow = container.querySelector(':scope > div > div');
  const wrapper = container.querySelector(':scope > div');
  if (!wrapper) return;

  const rowsHtml = data.map((row, idx) => createLotsRowMobile(row, { isLast: idx === data.length - 1 })).join('');
  if (headerRow) {
    wrapper.innerHTML = headerRow.outerHTML + rowsHtml;
  } else {
    wrapper.innerHTML = rowsHtml;
  }

  markLotsHeaderRow(wrapper);
  setupSortableHeaderRow(document.querySelector('#lotsKuvekinoMobile .listLots > div'), 'kuvekino', onSort);
}

function renderLotsBalashikha(data) {
  const container = document.getElementById('lotsBalashikha');
  if (!container) return;

  const headerRow = container.querySelector(':scope > div > div');
  const wrapper = container.querySelector(':scope > div');
  if (!wrapper) return;

  const visibleData = data.slice(0, visibleRowsBalashikha);
  const rowsHtml = visibleData.map(createLotsRow).join('');

  if (headerRow) {
    wrapper.innerHTML = headerRow.outerHTML + rowsHtml;
  } else {
    wrapper.innerHTML = rowsHtml;
  }

  markLotsHeaderRow(wrapper);
  updateShowMoreButtonBalashikha();
  setupSortableHeaderRow(document.querySelector('#lotsBalashikha > div > div'), 'balashikha', onSort);
}

function renderLotsBalashikhaMobile(data) {
  const container = document.getElementById('lotsBalashikhaMobile');
  if (!container) return;

  const headerRow = container.querySelector(':scope > div > div');
  const wrapper = container.querySelector(':scope > div');
  if (!wrapper) return;

  const rowsHtml = data.map((row, idx) => createLotsRowMobile(row, { isLast: idx === data.length - 1 })).join('');
  if (headerRow) {
    wrapper.innerHTML = headerRow.outerHTML + rowsHtml;
  } else {
    wrapper.innerHTML = rowsHtml;
  }

  markLotsHeaderRow(wrapper);
  setupSortableHeaderRow(document.querySelector('#lotsBalashikhaMobile .listLots > div'), 'balashikha', onSort);
}

function showMoreRows() {
  visibleRows += rowsPerPage;
  renderLotsSenkino(allData);
}

window.showMoreRows = showMoreRows;

function showMoreRowsKuvekino() {
  visibleRowsKuvekino += rowsPerPage;
  renderLotsKuvekino(allDataKuvekino);
}

function showMoreRowsBalashikha() {
  visibleRowsBalashikha += rowsPerPage;
  renderLotsBalashikha(allDataBalashikha);
}

function onSort(tableKey, colIndex) {
  if (tableKey === 'senkino') {
    allData = sortLotsData(allData, sortState.senkino, colIndex);
    renderLotsSenkino(allData);
    renderLotsSenkinoMobile(allData);
    return;
  }
  if (tableKey === 'kuvekino') {
    allDataKuvekino = sortLotsData(allDataKuvekino, sortState.kuvekino, colIndex);
    renderLotsKuvekino(allDataKuvekino);
    renderLotsKuvekinoMobile(allDataKuvekino);
    return;
  }
  if (tableKey === 'balashikha') {
    allDataBalashikha = sortLotsData(allDataBalashikha, sortState.balashikha, colIndex);
    renderLotsBalashikha(allDataBalashikha);
    renderLotsBalashikhaMobile(allDataBalashikha);
  }
}

async function initApp() {
  try {
    bindSortDelegation();

    // Senkino (sheet 1)
    const raw = await fetchTableData({ gid: SENKINO_GID });
    sheetHeaders = raw.headers || [];
    applyLotsHeaders(sheetHeaders);
    allData = formatTableData(raw.data || []);
    visibleRows = DESKTOP_INITIAL_ROWS;
    renderLotsSenkino(allData);
    renderLotsSenkinoMobile(allData);

    // bind sorting for Senkino headers (desktop + mobile)
    setupSortableHeaderRow(document.querySelector('#lotsSenkino > div > div'), 'senkino', onSort);
    setupSortableHeaderRow(document.querySelector('#lotsSenkinoMobile .listLots > div'), 'senkino', onSort);

    const btn = document.getElementById('showMoreSenkino');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = 'true';
      btn.addEventListener('click', showMoreRows);
    }

    // Kuvekino (sheet 2)
    const rawK = await fetchTableData({ gid: KUVEKINO_GID, sheetName: KUVEKINO_SHEET_NAME });
    sheetHeadersKuvekino = rawK.headers || [];
    // Reuse same header applier, but temporarily point it at Kuvekino DOM if present
    // (Kuvekino tables use the same 3-column header structure)
    const h = sheetHeadersKuvekino;
    if (h && h.length) {
      const normalized = (h || []).filter((x) => String(x ?? '').trim() !== '');
      const [h1, h2, h3] = normalized;

      const desktopHeaderRow = document.querySelector('#lotsKuvekino > div > div');
      if (desktopHeaderRow) {
        const ps = Array.from(desktopHeaderRow.querySelectorAll('p'));
        if (ps[0] && h1) ps[0].textContent = h1;
        if (ps[1] && h2) ps[1].textContent = h2;
        if (ps[2] && h3) ps[2].textContent = h3;
      }

      const mobileHeaderRow = document.querySelector('#lotsKuvekinoMobile .listLots > div');
      if (mobileHeaderRow) {
        const ps = Array.from(mobileHeaderRow.querySelectorAll('p'));
        if (ps[0] && h1) ps[0].textContent = h1;
        if (ps[1] && h2) ps[1].textContent = h2;
        if (ps[2] && h3) ps[2].textContent = h3;
      }
    }

    allDataKuvekino = formatTableData(rawK.data || []);
    visibleRowsKuvekino = DESKTOP_INITIAL_ROWS;
    renderLotsKuvekino(allDataKuvekino);
    renderLotsKuvekinoMobile(allDataKuvekino);

    // bind sorting for Kuvekino headers (desktop + mobile)
    setupSortableHeaderRow(document.querySelector('#lotsKuvekino > div > div'), 'kuvekino', onSort);
    setupSortableHeaderRow(document.querySelector('#lotsKuvekinoMobile .listLots > div'), 'kuvekino', onSort);

    const btnK = document.getElementById('showMoreKuvekino');
    if (btnK && !btnK.dataset.bound) {
      btnK.dataset.bound = 'true';
      btnK.addEventListener('click', showMoreRowsKuvekino);
    }

    // Balashikha (sheet 3)
    const rawB = await fetchTableData({ gid: BALASHIKHA_GID, sheetName: BALASHIKHA_SHEET_NAME });
    sheetHeadersBalashikha = rawB.headers || [];
    {
      const normalized = (sheetHeadersBalashikha || []).filter((x) => String(x ?? '').trim() !== '');
      const [h1, h2, h3] = normalized;

      const desktopHeaderRow = document.querySelector('#lotsBalashikha > div > div');
      if (desktopHeaderRow) {
        const ps = Array.from(desktopHeaderRow.querySelectorAll('p'));
        if (ps[0] && h1) ps[0].textContent = h1;
        if (ps[1] && h2) ps[1].textContent = h2;
        if (ps[2] && h3) ps[2].textContent = h3;
      }

      const mobileHeaderRow = document.querySelector('#lotsBalashikhaMobile .listLots > div');
      if (mobileHeaderRow) {
        const ps = Array.from(mobileHeaderRow.querySelectorAll('p'));
        if (ps[0] && h1) ps[0].textContent = h1;
        if (ps[1] && h2) ps[1].textContent = h2;
        if (ps[2] && h3) ps[2].textContent = h3;
      }
    }

    allDataBalashikha = formatTableData(rawB.data || []);
    visibleRowsBalashikha = DESKTOP_INITIAL_ROWS;
    renderLotsBalashikha(allDataBalashikha);
    renderLotsBalashikhaMobile(allDataBalashikha);

    const btnB = document.getElementById('showMoreBalashikha');
    if (btnB && !btnB.dataset.bound) {
      btnB.dataset.bound = 'true';
      btnB.addEventListener('click', showMoreRowsBalashikha);
    }
  } catch (error) {}
}

window.refreshTableData = async function () {
  await initApp();
};

document.addEventListener('DOMContentLoaded', initApp);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ===== src/js/customScroll.js =====
// скрипт шапки  и фикс скролла
(function () {
  if (typeof window > 'u' || window.__headerDomInitialized) return;
  window.__headerDomInitialized = !0;
  function l(t, e = 'active') {
    return (t && (t.getAttribute('data-active-class') || t.dataset.activeClass)) || e;
  }
  function f(t, e = 0) {
    const r = document.documentElement,
      n = getComputedStyle(r).getPropertyValue(t),
      o = parseInt(n, 10);
    return Number.isFinite(o) ? o : e;
  }
  function p() {
    const r = document.getElementById('scale-container');
    if (!r) return 1;
    const n = getComputedStyle(r);
    const o = parseFloat(n.zoom);
    if (Number.isFinite(o) && o > 0) return o;
    const u = n.transform;
    if (u && u !== 'none') {
      const a = u.match(/matrix\(([^)]+)\)/);
      if (a && a[1]) {
        const c = a[1].split(',').map((s) => parseFloat(s.trim()));
        if (c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1])) {
          const s = Math.sqrt(c[0] * c[0] + c[1] * c[1]);
          if (Number.isFinite(s) && s > 0) return s;
        }
      }
    }
    return 1;
  }
  function h() {
    const t = navigator.userAgent || '';
    // Safari UA contains "Safari" but not "Chrome/Chromium/Android"
    return /Safari/i.test(t) && !/Chrome|Chromium|Android/i.test(t);
  }
  function g(t) {
    const e = (t || '').replace('#', ''),
      r = f('--header-height', 0);
    let n = 0;
    if (e) {
      const o = document.getElementById(e);
      if (!o) return;
      const u = p();
      const a = o.getBoundingClientRect().top + window.pageYOffset - r;
      // Safari (macOS) + zoom needs compensation; Chrome does not.
      n = h() ? a * u : a;
    } else n = 0;
    const o = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const u = Math.min(Math.max(0, n), o);
    try {
      window.scrollTo({ top: u, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, u);
    }
  }
  function i(t) {
    const e = document.getElementById('header-dropdown'),
      r = document.querySelector('[data-dropdown-overlay]'),
      n = Array.from(document.querySelectorAll('[data-dropdown-trigger]')),
      o = e ? l(e) : 'active',
      u = r ? l(r) : 'active',
      a = typeof t == 'boolean' ? t : !(e && e.classList.contains(o));
    (e && e.classList.toggle(o, a), r && r.classList.toggle(u, a), n.forEach((c) => c.classList.toggle(l(c), a)));
  }
  function d(t) {
    const e = document.getElementById('header-burger-menu'),
      r = document.querySelector('[data-menu-overlay]'),
      n = Array.from(document.querySelectorAll('[data-menu-trigger]')),
      o = e ? l(e) : 'active',
      u = r ? l(r) : 'active',
      a = typeof t == 'boolean' ? t : !(e && e.classList.contains(o));
    (e && e.classList.toggle(o, a), r && r.classList.toggle(u, a), n.forEach((c) => c.classList.toggle(l(c), a)));
  }
  function m() {
    (document.addEventListener('click', (t) => {
      if (t.target.closest('[data-dropdown-trigger]')) {
        (t.preventDefault(), i());
        return;
      }
      if (t.target.closest('[data-menu-trigger]')) {
        (t.preventDefault(), d());
        return;
      }
      if (t.target.closest('[data-dropdown-overlay]')) {
        (t.preventDefault(), i(!1));
        return;
      }
      if (t.target.closest('[data-menu-overlay]')) {
        (t.preventDefault(), d(!1));
        return;
      }
      const u = t.target.closest('#header-burger-menu [data-burger-link]');
      if (u) {
        const s = u.getAttribute('href');
        (d(!1), i(!1), s && s.startsWith('#') && (t.preventDefault(), g(s)));
        return;
      }
      const a = t.target.closest('[data-scroll-to]');
      if (a) {
        const s = a.getAttribute('data-scroll-to');
        s && (t.preventDefault(), d(!1), i(!1), g(s.startsWith('#') ? s : `#${s}`));
        return;
      }
      const c = t.target.closest('a[href^="#"]');
      if (c) {
        const s = c.getAttribute('href');
        (t.preventDefault(), d(!1), i(!1), g(s));
        return;
      }
    }),
      document.addEventListener('keydown', (t) => {
        t.key === 'Escape' && (d(!1), i(!1));
      }));
  }
  m();
})();

// ===== src/js/scrollToTop.js =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-scroll-top]').forEach((el) => {
    el.addEventListener('click', () => {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, 0);
      }
    });
  });
});

// ===== src/js-test/main.js =====
/** Entry для test.html: аккордеон и таблицы лотов из js-test/, остальное — из src/js/. */

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
  if (sliderRoot.getAttribute('data-swiper-fade') === 'true') return;

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

  const infinite =
    sliderRoot.getAttribute('data-infinite') === 'true' && mode === 'translate' && !isPlansMobileNow();

  const prevButtons = Array.from(sliderRoot.querySelectorAll('[data-prev]'));
  const nextButtons = Array.from(sliderRoot.querySelectorAll('[data-next]'));
  const currentEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-current]'));
  const totalEls = Array.from(sliderRoot.querySelectorAll('[data-counter] [data-total]'));

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
