// Work Calculation Page Logic
// Features: unified header with date, modal with voice-to-text (bn-BD),
// grouped entries by date, per-date quick-add, PDF export.

(function() {
  const workToday = document.getElementById('workToday');
  const addBtn = document.getElementById('workAddBtn');
  const pdfBtn = document.getElementById('workPdfBtn');
  const tbody = document.getElementById('workTbody');

  const modalOverlay = document.getElementById('workModalOverlay');
  const modalClose = document.getElementById('workModalClose');
  const modalCancel = document.getElementById('workModalCancel');
  const modalSave = document.getElementById('workModalSave');

  const modalDate = document.getElementById('modalDate');
  const modalNote = document.getElementById('modalNote');
  const voiceBtn = document.getElementById('voiceBtn');
  const voiceHint = document.getElementById('voiceHint');
  const modalTon = document.getElementById('modalTon');
  const lenFt = document.getElementById('lenFt');
  const lenIn = document.getElementById('lenIn');
  const widFt = document.getElementById('widFt');
  const widIn = document.getElementById('widIn');
  const weldFt = document.getElementById('weldFt');
  const weldIn = document.getElementById('weldIn');

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
    return `${day}-${monthEn}-${dateObj.getFullYear()}`; // DD-MMM-YYYY
  }

  // Init today's date badge
  workToday.textContent = toDisplayDate(todayYYYYMMDD());

  function openModal(prefillDate) {
    modalOverlay.classList.add('show');
    modalOverlay.setAttribute('aria-hidden','false');
    modalDate.value = prefillDate || todayYYYYMMDD();
    modalNote.value = '';
    modalTon.value = '';
    [lenFt,lenIn,widFt,widIn,weldFt,weldIn].forEach(el => { el.value=''; el.classList.remove('error'); });
    setTimeout(() => modalDate.focus(), 0);
  }
  function closeModal() {
    modalOverlay.classList.remove('show');
    modalOverlay.setAttribute('aria-hidden','true');
  }

  // Voice to text (Web Speech API)
  let recognition = null;
  let recognizing = false;
  try {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognition = new SR();
      recognition.lang = 'bn-BD';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.onresult = (e) => {
        let interim = '';
        for (let i=e.resultIndex; i<e.results.length; i++) {
          const tr = e.results[i];
          if (tr.isFinal) {
            modalNote.value += (modalNote.value ? ' ' : '') + tr[0].transcript.trim();
          } else {
            interim += tr[0].transcript;
          }
        }
        voiceHint.textContent = interim ? `শুনছি… ${interim}` : 'ভয়েস চালু আছে';
      };
      recognition.onend = () => { recognizing = false; voiceBtn.setAttribute('aria-pressed','false'); voiceHint.textContent = 'ভয়েস বন্ধ'; };
    } else {
      voiceBtn.disabled = true; voiceHint.textContent = 'এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়';
    }
  } catch (e) {
    voiceBtn.disabled = true; voiceHint.textContent = 'ভয়েস ইনপুট শুরু করা যায়নি';
  }

  voiceBtn && voiceBtn.addEventListener('click', () => {
    if (!recognition) return;
    if (!recognizing) {
      recognition.start();
      recognizing = true;
      voiceBtn.setAttribute('aria-pressed','true');
      voiceHint.textContent = 'ভয়েস চালু আছে';
    } else {
      recognition.stop();
      recognizing = false;
      voiceBtn.setAttribute('aria-pressed','false');
      voiceHint.textContent = 'ভয়েস বন্ধ';
    }
  });

  function clearErrors() {
    [modalDate, modalTon, lenFt,lenIn,widFt,widIn,weldFt,weldIn, modalNote].forEach(el => el.classList.remove('error'));
  }

  function validateModal() {
    clearErrors();
    let ok = true;
    if (!modalDate.value) { modalDate.classList.add('error'); ok = false; }
    // Note is optional, but keep UI clean
    const ton = Number(modalTon.value);
    if (!isFinite(ton) || ton < 0) { modalTon.classList.add('error'); ok = false; }
    const fields = [lenFt,lenIn,widFt,widIn,weldFt,weldIn];
    fields.forEach(el => { if (el.value && (!isFinite(Number(el.value)) || Number(el.value) < 0)) { el.classList.add('error'); ok = false; } });
    return ok;
  }

  function normalizeFtIn(ft, inch) {
    const f = Math.max(0, Math.trunc(Number(ft||0)));
    const i = Math.max(0, Math.trunc(Number(inch||0)));
    const extraFt = Math.floor(i / 12);
    const remainIn = i % 12;
    return { ft: f + extraFt, inch: remainIn };
  }

  function clampInchesInput(el) {
    let v = Math.trunc(Number(el.value||0));
    if (!isFinite(v) || v < 0) v = 0;
    if (v > 11) v = 11;
    el.value = String(v);
  }

  function addRow(dateYMD, note, ton, len, wid, weld) {
    // locate group
    let groupRows = Array.from(tbody.querySelectorAll(`tr[data-date="${dateYMD}"]`));
    const displayDate = toDisplayDate(dateYMD);

    function createRow(showDate) {
      const tr = document.createElement('tr');
      tr.dataset.date = dateYMD;
      tr.innerHTML = `
        <td class="date-cell">${showDate ? `<span class="date-text">${displayDate}</span> <button class="date-add btn add-btn btn-xs" data-date="${dateYMD}" title="এই তারিখে নতুন কাজ যোগ করুন">+</button>` : ''}</td>
        <td class="note-cell">${note ? escapeHtml(note) : '<span class="placeholder">_</span>'}</td>
        <td>${isFinite(ton)? ton.toFixed(2): '0.00'}</td>
        <td>${len.ft}'-${String(len.inch).padStart(2,'0')}"</td>
        <td>${wid.ft}'-${String(wid.inch).padStart(2,'0')}"</td>
        <td>${weld.ft}'-${String(weld.inch).padStart(2,'0')}"</td>
          <td>
            <button class="btn edit-btn row-edit" title="এই সারি সম্পাদনা করুন">সম্পাদনা</button>
            <button class="btn danger-btn row-delete" title="এই সারি মুছুন">মুছুন</button>
          </td>
      `;
      return tr;
    }

    if (groupRows.length) {
      const tr = createRow(false);
      // insert after existing group
      const lastOfGroup = groupRows[groupRows.length-1];
      lastOfGroup.after(tr);
    } else {
      // create first row with date and + icon
      const first = createRow(true);
      tbody.appendChild(first);
    }
    sortGroups();
  }

  function sortGroups() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const groups = new Map();
    rows.forEach(r => { const d = r.dataset.date; if (!groups.has(d)) groups.set(d, []); groups.get(d).push(r); });
    const sorted = Array.from(groups.keys()).sort((a,b)=>a.localeCompare(b));
    tbody.innerHTML = '';
    sorted.forEach(d => {
      const displayDate = toDisplayDate(d);
      const list = groups.get(d);
      // ensure first row has date & +, others blank
      list.forEach((r,idx) => {
        const td = r.querySelector('.date-cell');
        td.innerHTML = idx===0 ? `<span class="date-text">${displayDate}</span> <button class="date-add btn add-btn btn-xs" data-date="${d}">+</button>` : '';
        tbody.appendChild(r);
      });
    });
  }

  function openForDate(dateYMD) { openModal(dateYMD); }

  function escapeHtml(s){ return s.replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

  function generatePdf() {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '16px';
    wrapper.style.fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';

    const title = document.createElement('h2');
    title.textContent = 'এম ভি নাজেরা (MV Nazera)';
    const subtitle = document.createElement('div');
    subtitle.textContent = 'কাজের হিসাব';
    subtitle.style.marginBottom = '12px';

    const dateLine = document.createElement('div');
    dateLine.textContent = 'তারিখ: ' + toDisplayDate(todayYYYYMMDD());
    dateLine.style.marginBottom = '12px';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '11px';

    const thead = document.createElement('thead');
    const headTr = document.createElement('tr');
    ['তারিখ','নোট','টন','লম্ব (ফিট/ইঞ্চি)','প্রস্থ (ফিট/ইঞ্চি)','ঝালাই (ফিট/ইঞ্চি)'].forEach(t => {
      const th = document.createElement('th');
      th.textContent = t; th.style.border = '1px solid #ccc'; th.style.background = '#f0f3f6'; th.style.padding = '5px 6px'; th.style.textAlign = 'left';
      headTr.appendChild(th);
    });
    thead.appendChild(headTr);

    const tbodyPdf = document.createElement('tbody');
    const groups = new Map();
    Array.from(tbody.querySelectorAll('tr')).forEach(r => {
      const d = r.dataset.date; if (!groups.has(d)) groups.set(d, []); groups.get(d).push(r);
    });
    const sorted = Array.from(groups.keys()).sort((a,b)=>a.localeCompare(b));
    sorted.forEach(d => {
      const rows = groups.get(d);
      rows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        const cells = row.querySelectorAll('td');
        const dateCell = document.createElement('td');
        dateCell.textContent = idx===0 ? toDisplayDate(d) : '';
        [dateCell].concat(Array.from(cells).slice(1,6).map(c => { const td = document.createElement('td'); td.innerHTML = c.innerHTML.replace(/<button[\s\S]*?<\/button>/,'').replace(/<span class="placeholder">_<\/span>/g, '_'); return td; })).forEach(td => {
          td.style.border='1px solid #ccc'; td.style.padding='5px 6px';
          tr.appendChild(td);
        });
        tbodyPdf.appendChild(tr);
      });
    });

    table.append(thead, tbodyPdf);
    wrapper.append(title, subtitle, dateLine, table);

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

    const opt = { margin:[10,10,10,10], filename:'work-report.pdf', image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2,useCORS:true}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'} };
    if (typeof window.html2pdf !== 'undefined') {
      window.html2pdf().set(opt).from(wrapper).save();
    } else {
      const temp = document.createElement('div'); temp.appendChild(wrapper);
      const w = window.open('', '_blank'); w.document.write(temp.innerHTML); w.document.close(); w.focus(); w.print(); w.close();
    }
  }

  // Events
  addBtn.addEventListener('click', () => openModal());
  pdfBtn.addEventListener('click', generatePdf);
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  // Clamp inches fields to 0-11 for better UX
  [lenIn, widIn, weldIn].forEach(el => el.addEventListener('change', () => clampInchesInput(el)));
  // Quick save: Ctrl+Enter inside modal
  modalOverlay.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      modalSave.click();
    }
  });

  tbody.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.matches('.date-add')) {
      const d = t.getAttribute('data-date');
      openForDate(d);
    } else if (t.matches('.row-edit')) {
      const tr = t.closest('tr');
      if (!tr) return;
      const d = tr.dataset.date;
      // We could parse cells to prefill, but for now open with date only.
      openForDate(d);
      } else if (t.matches('.row-delete')) {
        const tr = t.closest('tr');
        if (!tr) return;
        tr.remove();
        sortGroups();
    }
  });

  modalSave.addEventListener('click', () => {
    if (!validateModal()) return;
    const dateYMD = modalDate.value;
    const note = modalNote.value.trim();
    const ton = Number(modalTon.value||0);
    const len = normalizeFtIn(lenFt.value, lenIn.value);
    const wid = normalizeFtIn(widFt.value, widIn.value);
    const weld = normalizeFtIn(weldFt.value, weldIn.value);
    addRow(dateYMD, note, ton, len, wid, weld);
    closeModal();
  });
})();
