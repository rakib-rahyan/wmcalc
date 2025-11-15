// Paint Calculation Page Logic
// Features: Add Item modal, live product (Gallon*Liters), table insert, SUM footer, PDF download

(function() {
  const tbody = document.getElementById('paintTbody');
  const sumCell = document.getElementById('sumCell');
  const addItemBtn = document.getElementById('addItemBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalSave = document.getElementById('modalSave');

  const dateInput = document.getElementById('dateInput');
  const typeSelect = document.getElementById('typeSelect');
  const litersInput = document.getElementById('litersInput');
  const gallonInput = document.getElementById('gallonInput');
  const productPreview = document.getElementById('productPreview');

  function todayYYYYMMDD() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth()+1).padStart(2, '0');
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

  function openModal() {
    modalOverlay.classList.add('show');
    modalOverlay.setAttribute('aria-hidden', 'false');
    dateInput.value = todayYYYYMMDD();
    typeSelect.value = 'Paint';
    litersInput.value = '';
    gallonInput.value = '';
    productPreview.textContent = '0';
    clearErrors();
    setTimeout(() => dateInput.focus(), 0);
  }

  function closeModal() {
    modalOverlay.classList.remove('show');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }

  function clearErrors() {
    [dateInput, typeSelect, litersInput, gallonInput].forEach(el => el.classList.remove('error'));
  }

  function computeProduct() {
    const l = Number(litersInput.value);
    const g = Number(gallonInput.value);
    const product = (isFinite(l) ? l : 0) * (isFinite(g) ? g : 0);
    productPreview.textContent = Number(product).toFixed(2);
  }

  function validateModal() {
    clearErrors();
    let ok = true;
    if (!dateInput.value) { dateInput.classList.add('error'); ok = false; }
    const l = Number(litersInput.value);
    const g = Number(gallonInput.value);
    if (!isFinite(l) || l <= 0) { litersInput.classList.add('error'); ok = false; }
    if (!isFinite(g) || g <= 0) { gallonInput.classList.add('error'); ok = false; }
    return ok;
  }

  function addRow() {
    const date = toDisplayDate(dateInput.value);
    const type = typeSelect.value;
    const gallon = Number(gallonInput.value);
    const liters = Number(litersInput.value);
    const product = gallon * liters;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${date}</td>
      <td>${type}</td>
      <td>${gallon.toFixed(2)}</td>
      <td>${liters.toFixed(2)}</td>
      <td class="cell-product">${product.toFixed(2)}</td>
      <td><button type="button" class="btn danger-btn row-delete" aria-label="সারি মুছুন">মুছুন</button></td>
    `;
    tbody.appendChild(tr);
    updateSum();
  }

  function updateSum() {
    let sum = 0;
    tbody.querySelectorAll('.cell-product').forEach(td => {
      sum += Number(td.textContent) || 0;
    });
    sumCell.textContent = sum.toFixed(2);
  }

  function generatePdf() {
    // Build a clean wrapper for PDF: header + cloned table (including tfoot)
    const wrapper = document.createElement('div');
    wrapper.style.padding = '16px';
    wrapper.style.fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';

    const title = document.createElement('h2');
    title.textContent = 'এম ভি নাজেরা (MV Nazera)';
    title.style.margin = '0 0 4px 0';
    const subtitle = document.createElement('div');
    subtitle.textContent = 'রঙের হিসাব';
    subtitle.style.marginBottom = '12px';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '12px';

    const thead = document.createElement('thead');
    const headTr = document.createElement('tr');
    ['তারিখ','ক্ষমতা','গ্যালন','লিটার','গ্যালন × লিটার'].forEach(t => {
      const th = document.createElement('th');
      th.textContent = t;
      th.style.border = '1px solid #ccc';
      th.style.background = '#f0f3f6';
      th.style.padding = '6px 8px';
      th.style.textAlign = 'left';
      headTr.appendChild(th);
    });
    // action column not printed
    thead.appendChild(headTr);

    const tbodyPdf = document.createElement('tbody');
    tbody.querySelectorAll('tr').forEach(row => {
      const tr = document.createElement('tr');
      const cells = row.querySelectorAll('td');
      // Map current row cells to PDF order skipping action button cell
      const pdfCells = [cells[0], cells[1], cells[2], cells[3], cells[4]];
      pdfCells.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell.textContent;
        td.style.border = '1px solid #ccc';
        td.style.padding = '6px 8px';
        tr.appendChild(td);
      });
      tbodyPdf.appendChild(tr);
    });

    const tfoot = document.createElement('tfoot');
    const footTr = document.createElement('tr');
    const footLabel = document.createElement('td');
    footLabel.colSpan = 4;
    footLabel.textContent = 'মোট';
    footLabel.style.textAlign = 'right';
    footLabel.style.border = '1px solid #ccc';
    footLabel.style.padding = '6px 8px';
    const footVal = document.createElement('td');
    footVal.textContent = sumCell.textContent;
    footVal.style.border = '1px solid #ccc';
    footVal.style.padding = '6px 8px';
    footVal.style.fontWeight = '700';
    footTr.append(footLabel, footVal);
    tfoot.appendChild(footTr);

    table.append(thead, tbodyPdf, tfoot);

    wrapper.append(title, subtitle, table);

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     'paint-report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof window.html2pdf !== 'undefined') {
      window.html2pdf().set(opt).from(wrapper).save();
    } else {
      // Fallback if CDN blocked
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

  addItemBtn.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  litersInput.addEventListener('input', computeProduct);
  gallonInput.addEventListener('input', computeProduct);

  modalSave.addEventListener('click', () => {
    if (!validateModal()) return;
    addRow();
    closeModal();
  });

  // Row delete event delegation
  tbody.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.matches('.row-delete')) {
      const tr = t.closest('tr');
      if (tr) {
        tr.remove();
        updateSum();
      }
    }
  });

  downloadPdfBtn.addEventListener('click', generatePdf);
})();
