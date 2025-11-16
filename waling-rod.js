// Welding Rod Calculation Page Logic
// Handles: header date (readonly), modal add, remove, totals, PDF

(function() {
  // Utils
  function formatDisplayDate(iso) {
    if (!iso) return '';
    const [y,m,d] = iso.split('-');
    const dateObj = new Date(Number(y), Number(m)-1, Number(d));
    const day = String(dateObj.getDate()).padStart(2,'0');
    const monthEn = dateObj.toLocaleString('en-US', { month: 'short' });
    return `${day}-${monthEn}-${dateObj.getFullYear()}`; // DD-MMM-YYYY
  }
  function todayYYYYMMDD() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }

  // Header date display
  const weldingToday = document.getElementById('weldingToday');
  if (weldingToday) weldingToday.textContent = formatDisplayDate(todayYYYYMMDD());

  const entryBody = document.getElementById('entryBody');
  const totalValueEl = document.getElementById('totalValue');
  const addBtn = document.getElementById('weldAddBtn');
  const pdfBtn = document.getElementById('weldPdfBtn');

  // Modal elements
  const modalOverlay = document.getElementById('weldModalOverlay');
  const modalClose = document.getElementById('weldModalClose');
  const modalCancel = document.getElementById('weldModalCancel');
  const modalSave = document.getElementById('weldModalSave');
  const modalDate = document.getElementById('weldDate');
  const modalPacket = document.getElementById('weldPacket');
  const modalPieces = document.getElementById('weldPieces');

  let totalPieces = 0;

  function renumberRows() {
    const rows = entryBody.querySelectorAll('tr');
    rows.forEach((r, i) => {
      const idx = r.querySelector('.row-index');
      if (idx) idx.textContent = String(i + 1);
    });
  }
  function updateTotal() {
    const rows = Array.from(entryBody.querySelectorAll('tr'));
    totalPieces = rows.reduce((sum, r) => sum + (Number(r.dataset.pieces || 0) || 0), 0);
    totalValueEl.textContent = String(totalPieces);
  }

  function addRow(dateYMD, packet, pieces) {
    const tr = document.createElement('tr');
    tr.dataset.date = dateYMD;
    tr.dataset.packet = packet || '';
    tr.dataset.pieces = String(pieces);
    tr.innerHTML = `
      <td class="row-index">${entryBody.children.length + 1}</td>
      <td>${formatDisplayDate(dateYMD)}</td>
      <td>${packet ? packet.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])) : '-'}</td>
      <td>${pieces}</td>
      <td><button type="button" class="btn danger-btn row-remove">মুছুন</button></td>
    `;
    entryBody.appendChild(tr);
    updateTotal();
  }

  function deleteRow(tr) {
    tr.remove();
    renumberRows();
    updateTotal();
  }

  function openModal(prefillDate) {
    modalOverlay.classList.add('show');
    modalOverlay.setAttribute('aria-hidden', 'false');
    modalDate.value = prefillDate || todayYYYYMMDD();
    modalPacket.value = '';
    modalPieces.value = '';
    [modalDate, modalPacket, modalPieces].forEach(el => el.classList.remove('error'));
    setTimeout(() => modalDate.focus(), 0);
  }

  function closeModal() {
    modalOverlay.classList.remove('show');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }

  function validateModal() {
    [modalDate, modalPieces].forEach(el => el.classList.remove('error'));
    let ok = true;
    if (!modalDate.value) { modalDate.classList.add('error'); ok = false; }
    const pieces = Number(modalPieces.value);
    if (!modalPieces.value || !isFinite(pieces) || pieces <= 0) { modalPieces.classList.add('error'); ok = false; }
    return ok;
  }

  function generatePdf() {
    const rows = Array.from(entryBody.querySelectorAll('tr'));
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
    dateLine.textContent = 'তারিখ: ' + formatDisplayDate(todayYYYYMMDD());
    dateLine.style.marginBottom = '12px';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '12px';
    const thead = document.createElement('thead');
    const headTr = document.createElement('tr');
    ['#','তারিখ','প্যাকেট নাম','প্যাকেট'].forEach(t => {
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
      const packet = document.createElement('td'); packet.textContent = r.dataset.packet || '-';
      const pieces = document.createElement('td'); pieces.textContent = r.dataset.pieces || '0';
      [idx, dt, packet, pieces].forEach(td => { td.style.border = '1px solid #ccc'; td.style.padding = '6px 8px'; });
      tr.append(idx, dt, packet, pieces);
      tbody.appendChild(tr);
    });
    table.append(thead, tbody);

    const total = document.createElement('div');
    total.textContent = 'মোট প্যাকেট: ' + (totalValueEl.textContent || '0');
    total.style.marginTop = '10px';
    total.style.fontWeight = '600';

    wrapper.append(title, subtitle, dateLine, table, total);

    // Signature area
    const signWrap = document.createElement('div');
    signWrap.style.marginTop = '28px';
    const signLine = document.createElement('div');
    signLine.style.width = '220px';
    signLine.style.borderBottom = '1px solid #000';
    signLine.style.height = '28px';
    const signLabel = document.createElement('div');
    signLabel.textContent = 'স্বাক্ষর';
    signLabel.style.marginTop = '6px';
    signWrap.append(signLine, signLabel);
    wrapper.appendChild(signWrap);

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

  // Events
  addBtn.addEventListener('click', () => openModal());
  pdfBtn.addEventListener('click', generatePdf);
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  entryBody.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.matches('.row-remove')) {
      const tr = t.closest('tr');
      if (tr) deleteRow(tr);
    }
  });
  modalSave.addEventListener('click', () => {
    if (!validateModal()) return;
    const dateYMD = modalDate.value || todayYYYYMMDD();
    const packet = modalPacket.value.trim();
    const pieces = Math.trunc(Number(modalPieces.value));
    addRow(dateYMD, packet, pieces);
    closeModal();
  });
})();
