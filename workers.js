// Workers Work Report Logic
// Adds / updates date groups (two rows per date), sorting, underscore placeholders, PDF export.

(function() {
  const tbody = document.getElementById('workersTbody');
  const todaySpan = document.getElementById('workersToday');
  const addBtn = document.getElementById('workersAddBtn');
  const pdfBtn = document.getElementById('workersPdfBtn');

  const modalOverlay = document.getElementById('workersModalOverlay');
  const modalClose = document.getElementById('workersModalClose');
  const modalCancel = document.getElementById('workersModalCancel');
  const modalSave = document.getElementById('workersModalSave');

  const dateInput = document.getElementById('workersDateInput');
  const welderStart = document.getElementById('welderStart');
  const welderEnd = document.getElementById('welderEnd');
  const welderCount = document.getElementById('welderCount');
  const fitterStart = document.getElementById('fitterStart');
  const fitterEnd = document.getElementById('fitterEnd');
  const fitterCount = document.getElementById('fitterCount');

  function todayYYYYMMDD() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }
  function toDisplayDate(ymd) {
    if (!ymd) return '';
    const [y,m,d] = ymd.split('-');
    const dateObj = new Date(Number(y), Number(m)-1, Number(d));
    const day = String(dateObj.getDate()).padStart(2,'0');
    const monthEn = dateObj.toLocaleString('en-US', { month: 'short' });
    return `${day}-${monthEn}-${dateObj.getFullYear()}`;
  }
  function displayToday() {
    todaySpan.textContent = toDisplayDate(todayYYYYMMDD());
  }

  displayToday();

  function openModal(existingDateYMD) {
    modalOverlay.classList.add('show');
    modalOverlay.setAttribute('aria-hidden','false');
    dateInput.value = existingDateYMD || todayYYYYMMDD();
    // Clear fields
    [welderStart, welderEnd, welderCount, fitterStart, fitterEnd, fitterCount].forEach(el => { el.value = ''; el.classList.remove('error'); });
    setTimeout(() => dateInput.focus(), 0);
  }
  function closeModal() {
    modalOverlay.classList.remove('show');
    modalOverlay.setAttribute('aria-hidden','true');
  }

  function clearErrors() {
    [dateInput, welderStart, welderEnd, welderCount, fitterStart, fitterEnd, fitterCount].forEach(el => el.classList.remove('error'));
  }

  function saveGroup() {
    clearErrors();
    if (!dateInput.value) { dateInput.classList.add('error'); return; }
    const dateYMD = dateInput.value;
    const displayDate = toDisplayDate(dateYMD);

    const wStart = welderStart.value.trim();
    const wEnd = welderEnd.value.trim();
    const wCount = welderCount.value.trim();
    const fStart = fitterStart.value.trim();
    const fEnd = fitterEnd.value.trim();
    const fCount = fitterCount.value.trim();

    // Find existing group
    const existingRows = Array.from(tbody.querySelectorAll('tr[data-date="'+dateYMD+'"]'));
    if (existingRows.length >= 2) {
      // Update
      updateRow(existingRows[0], displayDate, 'ওয়েল্ডার', wStart, wEnd, wCount);
      updateRow(existingRows[1], '', 'ফিটার', fStart, fEnd, fCount);
    } else {
      // Create new group (2 rows)
      const welderRow = createRow(dateYMD, displayDate, 'ওয়েল্ডার', wStart, wEnd, wCount);
      const fitterRow = createRow(dateYMD, '', 'ফিটার', fStart, fEnd, fCount);
      tbody.append(welderRow, fitterRow);
    }
    sortGroups();
    closeModal();
  }

  function createRow(dateYMD, dateDisplay, workerType, start, end, count) {
    const tr = document.createElement('tr');
    tr.dataset.date = dateYMD;
    tr.innerHTML = `
      <td class="date-cell">${dateDisplay || ''}</td>
      <td class="worker-type">${workerType}</td>
      <td>${formatCell(start)}</td>
      <td>${formatCell(end)}</td>
      <td>${formatCell(count)}</td>
    `;
    return tr;
  }

  function updateRow(tr, dateDisplay, workerType, start, end, count) {
    const cells = tr.querySelectorAll('td');
    cells[0].innerHTML = dateDisplay || '';
    cells[1].innerHTML = workerType;
    cells[2].innerHTML = formatCell(start);
    cells[3].innerHTML = formatCell(end);
    cells[4].innerHTML = formatCell(count);
  }

  function formatCell(val) {
    if (!val) return '<span class="placeholder">_</span>';
    return val;
  }

  function sortGroups() {
    // Collect groups keyed by date; each group has two rows.
    const groupsMap = new Map();
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach(r => {
      const date = r.dataset.date;
      if (!groupsMap.has(date)) groupsMap.set(date, []);
      groupsMap.get(date).push(r);
    });
    const sortedDates = Array.from(groupsMap.keys()).sort((a,b) => a.localeCompare(b));
    // Clear tbody
    tbody.innerHTML = '';
    sortedDates.forEach(d => {
      const groupRows = groupsMap.get(d);
      // Ensure first row shows date, second blank
      if (groupRows.length === 2) {
        const displayDate = toDisplayDate(d);
        groupRows[0].querySelector('.date-cell').innerHTML = displayDate;
        groupRows[1].querySelector('.date-cell').innerHTML = '';
      }
      groupRows.forEach(r => tbody.appendChild(r));
    });
  }

  function generatePdf() {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '16px';
    wrapper.style.fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';

    const title = document.createElement('h2');
    title.textContent = 'এম ভি নাজেরা (MV Nazera)';
    title.style.margin = '0 0 4px 0';
    const subtitle = document.createElement('div');
    subtitle.textContent = 'ওয়ারকারদের কাজের হিসাব';
    subtitle.style.marginBottom = '12px';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '11px';

    const thead = document.createElement('thead');
    const headTr = document.createElement('tr');
    ['তারিখ','শ্রমিকের ধরন','শুরুর সময়','শেষ সময়','শ্রমিক সংখ্যা'].forEach(t => {
      const th = document.createElement('th');
      th.textContent = t;
      th.style.border = '1px solid #ccc';
      th.style.background = '#f0f3f6';
      th.style.padding = '5px 6px';
      th.style.textAlign = 'left';
      headTr.appendChild(th);
    });
    thead.appendChild(headTr);

    const tbodyPdf = document.createElement('tbody');
    Array.from(tbody.querySelectorAll('tr')).forEach(row => {
      const tr = document.createElement('tr');
      const tds = row.querySelectorAll('td');
      tds.forEach(cell => {
        const td = document.createElement('td');
        td.innerHTML = cell.innerHTML.replace(/<span class="placeholder">_<\/span>/g,'_');
        td.style.border = '1px solid #ccc';
        td.style.padding = '5px 6px';
        tr.appendChild(td);
      });
      tbodyPdf.appendChild(tr);
    });

    table.append(thead, tbodyPdf);
    wrapper.append(title, subtitle, table);

    const opt = {
      margin: [10,10,10,10],
      filename: 'workers-report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof window.html2pdf !== 'undefined') {
      window.html2pdf().set(opt).from(wrapper).save();
    } else {
      const temp = document.createElement('div'); temp.appendChild(wrapper);
      const w = window.open('', '_blank');
      w.document.write(temp.innerHTML); w.document.close(); w.focus(); w.print(); w.close();
    }
  }

  addBtn.addEventListener('click', () => openModal());
  pdfBtn.addEventListener('click', generatePdf);
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  modalSave.addEventListener('click', saveGroup);
})();
