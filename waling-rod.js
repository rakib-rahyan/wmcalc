// Welding Rod Calculation Page Logic
// Handles: auto date, adding rows, saving entries, total sum, printing

(function() {
  // Utility: format ISO date (YYYY-MM-DD) into English display with month abbreviation
  function formatDisplayDate(iso) {
    if (!iso) return '';
    const [y,m,d] = iso.split('-');
    const dateObj = new Date(Number(y), Number(m)-1, Number(d));
    const day = String(dateObj.getDate()).padStart(2,'0');
    const monthEn = dateObj.toLocaleString('en-US', { month: 'short' });
    return `${day}-${monthEn}-${dateObj.getFullYear()}`; // DD-MMM-YYYY
  }
  const today = new Date();
  const dateInput = document.getElementById('currentDate');
  if (dateInput) {
    dateInput.value = today.toISOString().split('T')[0];
  }

  const entryBody = document.getElementById('entryBody');
  const addRowBtn = document.getElementById('addRowBtn');
  const totalValueEl = document.getElementById('totalValue');
  const printBtn = document.getElementById('printBtn');

  let totalPic = 0;
  let nextIndex = 2; // first row is 1

  function renumberRows() {
    const rows = entryBody.querySelectorAll('tr');
    let i = 1;
    rows.forEach(r => {
      const idx = r.querySelector('.row-index');
      if (idx) idx.textContent = String(i++);
    });
    nextIndex = i;
  }

  function createEditRow(index) {
    const tr = document.createElement('tr');
    tr.className = 'edit-row';
    tr.innerHTML = `
      <td class="row-index">${index}</td>
      <td><input type="date" class="input-date" /></td>
      <td><input type="number" min="0" step="1" class="input-pic" placeholder="0" /></td>
      <td>
        <button type="button" class="btn save-btn" data-action="save">সংরক্ষণ</button>
        <button type="button" class="btn danger-btn delete-btn" data-action="delete">মুছুন</button>
      </td>
    `;
    return tr;
  }

  function validateInputs(dateEl, picEl) {
    dateEl.classList.remove('error');
    picEl.classList.remove('error');
    const dateVal = dateEl.value || new Date().toISOString().split('T')[0];
    const picVal = Number(picEl.value);
    if (!picEl.value || isNaN(picVal) || picVal <= 0) {
      picEl.classList.add('error');
      picEl.focus();
      return null;
    }
    return { dateVal, picVal: Math.trunc(picVal) };
  }

  function saveRow(tr) {
    const dateEl = tr.querySelector('.input-date');
    const picEl = tr.querySelector('.input-pic');
    const res = validateInputs(dateEl, picEl);
    if (!res) return;

    const { dateVal, picVal } = res;
    totalPic += picVal;
    totalValueEl.textContent = totalPic.toString();

    tr.dataset.saved = 'true';
    tr.dataset.pic = String(picVal);
    tr.dataset.date = dateVal;

    tr.classList.remove('edit-row');
    const rowNumber = tr.querySelector('.row-index').textContent;
    tr.innerHTML = `
      <td class="row-index">${rowNumber}</td>
      <td>${formatDisplayDate(dateVal)}</td>
      <td>${picVal}</td>
      <td>
        <button type="button" class="btn edit-btn" data-action="edit">সম্পাদনা</button>
      </td>
    `;

    appendEditRow();
  }

  function deleteRow(tr) {
    if (tr.dataset.saved === 'true') {
      const pic = Number(tr.dataset.pic || 0);
      totalPic = Math.max(0, totalPic - pic);
      totalValueEl.textContent = String(totalPic);
    }
    tr.remove();
    renumberRows();
  }

  function handleRowClick(e) {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.matches('button.save-btn')) {
      const tr = target.closest('tr');
      if (tr) saveRow(tr);
    } else if (target.matches('button.delete-btn')) {
      const tr = target.closest('tr');
      if (tr) deleteRow(tr);
    } else if (target.matches('button.edit-btn')) {
      const tr = target.closest('tr');
      if (tr) enterEditMode(tr);
    }
  }

  function appendEditRow() {
    const newRow = createEditRow(nextIndex++);
    entryBody.appendChild(newRow);
    const dateField = newRow.querySelector('.input-date');
    dateField.value = new Date().toISOString().split('T')[0];
    newRow.querySelector('.input-pic').focus();
  }

  function enterEditMode(tr) {
    // If this was a saved row, remove its amount from total temporarily
    if (tr.dataset.saved === 'true') {
      const prev = Number(tr.dataset.pic || 0);
      totalPic = Math.max(0, totalPic - prev);
      totalValueEl.textContent = String(totalPic);
    }
    const rowNo = tr.querySelector('.row-index')?.textContent || '';
    const dateVal = tr.dataset.date || '';
    const picVal = tr.dataset.pic || '';
    tr.className = 'edit-row';
    tr.removeAttribute('data-saved');
    delete tr.dataset.saved;
    delete tr.dataset.pic;
    delete tr.dataset.date;
    tr.innerHTML = `
      <td class="row-index">${rowNo}</td>
      <td><input type="date" class="input-date" value="${dateVal}" /></td>
      <td><input type="number" min="0" step="1" class="input-pic" placeholder="0" value="${picVal}" /></td>
      <td>
        <button type="button" class="btn save-btn" data-action="save">সংরক্ষণ</button>
        <button type="button" class="btn danger-btn delete-btn" data-action="delete">মুছুন</button>
      </td>
    `;
    const picField = tr.querySelector('.input-pic');
    picField && picField.focus();
  }

  function generatePdf() {
    const rows = Array.from(entryBody.querySelectorAll('tr')).filter(r => r.dataset.saved === 'true');
    const wrapper = document.createElement('div');
    wrapper.style.padding = '16px';
    wrapper.style.fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';

    const title = document.createElement('h2');
    title.textContent = 'এম ভি নাজেরা (MV Nazera)';
    title.style.margin = '0 0 4px 0';
    const subtitle = document.createElement('div');
    subtitle.textContent = 'ওয়েল্ডিং রডের হিসাব';
    subtitle.style.marginBottom = '12px';
    const dateLine = document.createElement('div');
    dateLine.textContent = 'তারিখ: ' + (document.getElementById('currentDate').value || '');
    dateLine.style.marginBottom = '12px';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '12px';
    const thead = document.createElement('thead');
    const headTr = document.createElement('tr');
    ['#','তারিখ','ওয়েল্ডিং রড PIC'].forEach(t => {
      const th = document.createElement('th');
      th.textContent = t;
      th.style.border = '1px solid #ccc';
      th.style.background = '#f0f3f6';
      th.style.padding = '6px 8px';
      th.style.textAlign = 'left';
      headTr.appendChild(th);
    });
    thead.appendChild(headTr);
    const tbody = document.createElement('tbody');
    rows.forEach((r, i) => {
      const tr = document.createElement('tr');
      const idx = document.createElement('td'); idx.textContent = String(i+1);
      const dt = document.createElement('td'); dt.textContent = formatDisplayDate(r.dataset.date || '');
      const pic = document.createElement('td'); pic.textContent = r.dataset.pic || '0';
      [idx, dt, pic].forEach(td => { td.style.border = '1px solid #ccc'; td.style.padding = '6px 8px'; });
      tr.append(idx, dt, pic);
      tbody.appendChild(tr);
    });
    table.append(thead, tbody);

    const total = document.createElement('div');
    total.textContent = 'মোট ওয়েল্ডিং রড PIC যোগ হয়েছে: ' + (totalValueEl.textContent || '0');
    total.style.marginTop = '10px';
    total.style.fontWeight = '600';

    wrapper.append(title, subtitle, dateLine, table, total);

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     'welding-rod-report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    if (typeof window.html2pdf !== 'undefined') {
      window.html2pdf().set(opt).from(wrapper).save();
    } else {
      // Fallback to browser print if library failed to load
      const temp = document.createElement('div');
      temp.appendChild(wrapper);
      const w = window.open('', '_blank');
      w.document.write(temp.innerHTML);
      w.document.close();
      w.focus();
      w.print();
      w.close();
    }
  }

  addRowBtn.addEventListener('click', appendEditRow);
  entryBody.addEventListener('click', handleRowClick);
  printBtn.addEventListener('click', generatePdf);

  const firstRowDate = entryBody.querySelector('.edit-row .input-date');
  if (firstRowDate && !firstRowDate.value) {
    firstRowDate.value = today.toISOString().split('T')[0];
  }
})();
