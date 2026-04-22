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
let visibleRows = 7;

let allDataKuvekino = [];
let sheetHeadersKuvekino = [];
let visibleRowsKuvekino = 7;

let allDataBalashikha = [];
let sheetHeadersBalashikha = [];
let visibleRowsBalashikha = 7;
const rowsPerPage = 7;

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
    if (ps[1] && h2) {
      // keep the visual line-break like "дата<br/>доступа"
      ps[1].innerHTML = escapeHtml(h2).replaceAll(' ', '<br />');
    }
    if (ps[2] && h3) ps[2].textContent = h3;
  }
}

function createLotsRow({ area, date, docks }) {
  // Структура и классы должны соответствовать `#lotsSenkino` в index.html:
  // 3 колонки: площадь / дата доступа / тип погрузки
  return `
    <div class="flex justify-between py-[24px] border-b border-[var(--stroke-light)]">
      <p class="text-[13px] text-[var(--pikBlack)] uppercase w-full">${escapeHtml(area)}</p>
      <p class="text-[13px] text-[var(--pikBlack)] uppercase w-[112px] shrink-0">${escapeHtml(date)}</p>
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

  const rowsHtml = data
    .map((row, idx) => createLotsRowMobile(row, { isLast: idx === data.length - 1 }))
    .join('');
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
    visibleRows = 7;
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
        if (ps[1] && h2) ps[1].innerHTML = escapeHtml(h2).replaceAll(' ', '<br />');
        if (ps[2] && h3) ps[2].textContent = h3;
      }
    }

    allDataKuvekino = formatTableData(rawK.data || []);
    visibleRowsKuvekino = 7;
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
        if (ps[1] && h2) ps[1].innerHTML = escapeHtml(h2).replaceAll(' ', '<br />');
        if (ps[2] && h3) ps[2].textContent = h3;
      }
    }

    allDataBalashikha = formatTableData(rawB.data || []);
    visibleRowsBalashikha = 7;
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
