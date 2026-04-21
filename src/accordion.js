document.addEventListener('DOMContentLoaded', () => {
  const accordions = [
    document.getElementById('secondAccordion'),
    document.getElementById('lastAccordion'),
  ]
  const mobileTriggers = [
    {
      trigger: document.getElementById('accordionCardMobileSenkino'),
      acc: document.getElementById('secondAccordion'),
    },
    {
      trigger: document.getElementById('accordionCardMobileKuvekino'),
      acc: document.getElementById('lastAccordion'),
    },
  ]
  const listSenkino = document.getElementById('listSenkino')
  const listKuvekino = document.getElementById('listKuvekino')
  const closeListSenk = document.getElementById('closeListSenk')
  const closeListKuv = document.getElementById('closeListKuv')

  closeListSenk?.addEventListener('click', (e) => {
    e.stopPropagation()
    listSenkino?.classList.add('hidden')
  })

  closeListKuv?.addEventListener('click', (e) => {
    e.stopPropagation()
    listKuvekino?.classList.add('hidden')
  })

  function hideLists() {
    listSenkino?.classList.add('hidden')
    listKuvekino?.classList.add('hidden')
  }

  function showListForAccordion(acc) {
    // On mobile (< 768px) do not show popups at all
    if (window.innerWidth < 768) {
      hideLists()
      return
    }
    hideLists()
    if (!acc) return
    if (acc.id === 'secondAccordion') listSenkino?.classList.remove('hidden')
    if (acc.id === 'lastAccordion') listKuvekino?.classList.remove('hidden')
  }

  function getAvailableHeightPx(card) {
    const wrap = card.parentElement
    if (!wrap) return card.scrollHeight

    const siblingsHeight = Array.from(wrap.children)
      .filter((el) => el !== card)
      .reduce((sum, el) => sum + el.offsetHeight, 0)

    const available = wrap.clientHeight - siblingsHeight
    return Math.max(0, available || 0)
  }

  function closeAll() {
    hideLists()
    accordions.forEach((acc) => {
      if (!acc) return
      const card = acc.querySelector('.accordionCard')
      if (!card) return

      // чтобы закрытие тоже анимировалось: сначала фиксируем текущую высоту в px
      card.style.maxHeight = card.offsetHeight + 'px'
      // затем в следующий кадр схлопываем до 0
      requestAnimationFrame(() => {
        card.style.maxHeight = '0px'
      })

      card.style.height = ''
      card.style.flex = ''
      const wrap = card.parentElement
      if (wrap) wrap.style.height = ''

      acc.style.flex = ''
      acc.classList.remove('prior')
      card.classList.remove('is-open')
    })
  }

  function openCard(acc, card) {
    if (!acc) return
    showListForAccordion(acc)
    card.classList.add('is-open')
    acc.classList.add('prior')
    // Растягиваем открытый аккордеон на всю высоту родителя и сохраняем анимацию через max-height (px)
    acc.style.flex = '1 1 0%'

    const wrap = card.parentElement
    if (wrap) wrap.style.height = '100%'

    // анимируем max-height до доступной высоты в px.
    // Важно: дать браузеру применить flex/height, иначе расчёт может дать 0 и контент не покажется.
    card.style.maxHeight = '0px'
    requestAnimationFrame(() => {
      const target = getAvailableHeightPx(card) || card.scrollHeight
      card.style.maxHeight = target + 'px'
    })

    // после окончания анимации фиксируем растяжение, чтобы контент занимал 100%
    const onEnd = (e) => {
      if (e.propertyName !== 'max-height') return
      card.removeEventListener('transitionend', onEnd)
      if (!card.classList.contains('is-open')) return
      card.style.flex = '1 1 auto'
      card.style.height = '100%'
      card.style.maxHeight = 'none'
    }
    card.addEventListener('transitionend', onEnd)
  }

  // начальное состояние
  closeAll()

  // клики
  const isMobile = () => window.innerWidth < 768

  // Desktop: click on whole row is OK
  accordions.forEach((acc) => {
    if (!acc) return
    acc.addEventListener('click', () => {
      if (isMobile()) return
      const card = acc.querySelector('.accordionCard')
      if (!card) return

      const wasOpen = card.classList.contains('is-open')
      closeAll()
      if (!wasOpen) openCard(acc, card)
    })
  })

  // Mobile: only click on small header blocks
  mobileTriggers.forEach(({ trigger, acc }) => {
    if (!trigger || !acc) return
    trigger.addEventListener('click', (e) => {
      if (!isMobile()) return
      e.stopPropagation()
      const card = acc.querySelector('.accordionCard')
      if (!card) return

      const wasOpen = card.classList.contains('is-open')
      closeAll()
      if (!wasOpen) openCard(acc, card)
    })
  })
})
