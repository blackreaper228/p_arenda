function initShowMore(listId, buttonId, visibleCount = 8) {
  const list = document.getElementById(listId);
  const button = document.getElementById(buttonId);

  if (!list || !button) return;

  // Внутри списка есть обёртка с заголовком и строками.
  // Берём первый дочерний элемент как контейнер строк.
  const rowsWrapper = list.firstElementChild || list;
  const allRows = Array.from(rowsWrapper.children);

  // Первая строка — заголовок, остальные считаем как элементы списка.
  const dataRows = allRows.slice(1);

  if (dataRows.length <= visibleCount) {
    // Элементов меньше или равно 8 — кнопку скрываем.
    button.style.display = 'none';
    return;
  }

  // Показываем только первые visibleCount элементов, остальные скрываем.
  dataRows.forEach((row, index) => {
    if (index >= visibleCount) {
      row.style.display = 'none';
    }
  });

  button.addEventListener('click', () => {
    dataRows.forEach((row) => {
      row.style.display = '';
    });
    button.style.display = 'none';
  });
}

function initShowMoreLists() {
  initShowMore('lotsSenkino', 'showMoreSenkino', 6);
  initShowMore('lotsKuvekino', 'showMoreKuvekino', 6);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShowMoreLists);
} else {
  initShowMoreLists();
}
