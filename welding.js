// Welding Calculation Page
(function() {
  const todayBadge = document.getElementById('wcalcToday');
  const pdfBtn = document.getElementById('wcalcPdfBtn');
  const tbody = document.getElementById('wcalcTbody');

  const dateInput = document.getElementById('wcalcDateInput');
  const orientationSel = document.getElementById('wcalcOrientation');
  const sideSel = document.getElementById('wcalcSide');
  const vCheck = document.getElementById('wcalcVCheck');
  const addBtn = document.getElementById('wcalcAddBtn');

  const modalOverlay = document.getElementById('wcalcModalOverlay');
  const modalClose = document.getElementById('wcalcModalClose');
  const modalCancel = document.getElementById('wcalcModalCancel');
  const modalSave = document.getElementById('wcalcModalSave');
  const inputFt = document.getElementById('wcalcFt');
  const inputIn = document.getElementById('wcalcIn');

  function todayYYYYMMDD() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }
  function toDisplayDate(iso) {
    if (!iso) return '';
    const [y,m,d] = iso.split('-');
    const dateObj = new Date(Number(y), Number(m)-1, Number(d));
    const day = String(dateObj.getDate()).padStart(2,'0');
    const monthEn = dateObj.toLocaleString('en-US', { month: 'short' });
    return `${day}-${monthEn}-${dateObj.getFullYear()}`;
  }

  // init dates
  const today = todayYYYYMMDD();
  todayBadge.textContent = toDisplayDate(today);
  dateInput.value = today;

  function clampInches(el) {
    let v = Math.trunc(Number(el.value||0));
    if (!isFinite(v) || v < 0) v = 0;
    if (v > 11) v = 11;
    el.value = String(v);
  }

  function openModal() {
    modalOverlay.classList.add('show');
    modalOverlay.setAttribute('aria-hidden','false');
    inputFt.value = '';
    inputIn.value = '';
    inputFt.classList.remove('error');
    inputIn.classList.remove('error');
    setTimeout(()=> inputFt.focus(), 0);
  }
  function closeModal() {
    modalOverlay.classList.remove('show');
    modalOverlay.setAttribute('aria-hidden','true');
  }

  function normalizeFtIn(ft, inch) {
    const f = Math.max(0, Math.trunc(Number(ft||0)));
    const i = Math.max(0, Math.trunc(Number(inch||0)));
    const extraFt = Math.floor(i/12);
    const remainIn = i % 12;
    return { ft: f + extraFt, inch: remainIn };
  }

  function addRow(ftIn) {
    const tr = document.createElement('tr');
    tr.dataset.ft = String(ftIn.ft);
    tr.dataset.inch = String(ftIn.inch);
    tr.innerHTML = `
      <td class="row-index">${tbody.children.length + 1}</td>
      <td>${ftIn.ft}'-${String(ftIn.inch).padStart(2,'0')}"</td>
      <td><button type="button" class="btn danger-btn row-delete">মুছুন</button></td>
    `;
    tbody.appendChild(tr);
    renumber();
  }

  function renumber() {
    Array.from(tbody.children).forEach((tr, idx)=>{
      const c = tr.querySelector('.row-index');
      if (c) c.textContent = String(idx+1);
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
    subtitle.textContent = 'ওয়েল্ডিং ক্যালকুলেশন';
    subtitle.style.marginBottom = '12px';

    const metaDate = document.createElement('div');
    metaDate.textContent = 'তারিখ: ' + toDisplayDate(dateInput.value || today);
    metaDate.style.marginBottom = '6px';

    const metaLine = document.createElement('div');
    const orientation = orientationSel.value || '';
    const side = sideSel.value || '';
    const v = vCheck.checked ? 'হ্যাঁ' : 'না';
    metaLine.textContent = `দিক: ${orientation} | পাশ: ${side} | V ওয়েল্ডিং: ${v}`;
    metaLine.style.marginBottom = '12px';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '12px';
    const thead = document.createElement('thead');
    const headTr = document.createElement('tr');
    ;['#', 'মাপ (ফিট/ইঞ্চি)'].forEach(t => {
      const th = document.createElement('th');
      th.textContent = t;
      th.style.border = '1px solid #ccc';
      th.style.background = '#f0f3f6';
      th.style.padding = '6px 8px';
      th.style.textAlign = 'left';
      headTr.appendChild(th);
    });
    thead.appendChild(headTr);

    const tbodyPdf = document.createElement('tbody');
    Array.from(tbody.children).forEach((row, i) => {
      const tr = document.createElement('tr');
      const idx = document.createElement('td'); idx.textContent = String(i+1);
      const measure = document.createElement('td');
      const ft = row.dataset.ft || '0';
      const inch = row.dataset.inch || '0';
      measure.textContent = `${ft}'-${String(inch).padStart(2,'0')}"`;
      [idx, measure].forEach(td=>{ td.style.border='1px solid #ccc'; td.style.padding='6px 8px'; });
      tr.append(idx, measure);
      tbodyPdf.appendChild(tr);
    });

    table.append(thead, tbodyPdf);

    wrapper.append(title, subtitle, metaDate, metaLine, table);

    // Signature
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

    const opt = { margin:[10,10,10,10], filename:'welding-calc.pdf', image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2,useCORS:true}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'} };
    if (typeof window.html2pdf !== 'undefined') {
      window.html2pdf().set(opt).from(wrapper).save();
    } else {
      const temp = document.createElement('div'); temp.appendChild(wrapper);
      const w = window.open('', '_blank'); w.document.write(temp.innerHTML); w.document.close(); w.focus(); w.print(); w.close();
    }
  }

  // events
  addBtn.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e)=>{ if (e.target === modalOverlay) closeModal(); });
  [inputIn].forEach(el => el.addEventListener('change', ()=> clampInches(el)));
  modalSave.addEventListener('click', ()=>{
    inputFt.classList.remove('error');
    inputIn.classList.remove('error');
    const n = normalizeFtIn(inputFt.value, inputIn.value);
    if (n.ft === 0 && n.inch === 0) {
      inputFt.classList.add('error');
      inputIn.classList.add('error');
      return;
    }
    addRow(n);
    closeModal();
  });
  tbody.addEventListener('click', (e)=>{
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.matches('.row-delete')) {
      const tr = t.closest('tr');
      if (tr) { tr.remove(); renumber(); }
    }
  });
  pdfBtn.addEventListener('click', generatePdf);
})();
