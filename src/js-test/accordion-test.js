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
