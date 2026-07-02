(function () {
  'use strict';

  const STORAGE_KEYS = {
    company: 'qt_invoice_company',
    payment: 'qt_invoice_payment',
    settings: 'qt_invoice_settings',
    currentInvoice: 'qt_invoice_current',
    invoiceCounter: 'qt_invoice_counter',
    logoData: 'qt_invoice_logo',
    profileCompleted: 'qt_profile_completed',
    profileProtectionEnabled: 'qt_profile_protection_enabled',
    profilePasswordHash: 'qt_profile_password_hash',
    profilePasswordSalt: 'qt_profile_password_salt',
    profilePasswordIterations: 'qt_profile_password_iterations'
  };

  const SESSION_KEYS = {
    profileUnlocked: 'qt_profile_unlocked'
  };

  const DEFAULTS = {
    counter: 1001,
    invoicePrefix: 'INV',
    currency: '$',
    passwordIterations: 150000,
    item: {
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      vat: 15
    }
  };

  const dom = {
    errorPanel: document.getElementById('errorPanel'),
    errorList: document.getElementById('errorList'),
    itemsBody: document.getElementById('itemsBody'),
    previewItemsBody: document.getElementById('previewItemsBody'),
    currencySymbol: document.getElementById('currencySymbol'),
    invoicePrefix: document.getElementById('invoicePrefix'),
    invoiceNumber: document.getElementById('invoiceNumber'),
    invoiceDate: document.getElementById('invoiceDate'),
    dueDate: document.getElementById('dueDate'),
    logoUpload: document.getElementById('logoUpload'),
    logoPreview: document.getElementById('logoPreview'),
    addItemBtn: document.getElementById('addItemBtn'),
    newInvoiceBtn: document.getElementById('newInvoiceBtn'),
    saveInvoiceBtn: document.getElementById('saveInvoiceBtn'),
    loadInvoiceBtn: document.getElementById('loadInvoiceBtn'),
    printInvoiceBtn: document.getElementById('printInvoiceBtn'),
    downloadPdfBtn: document.getElementById('downloadPdfBtn'),
    clearInvoiceBtn: document.getElementById('clearInvoiceBtn'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    subtotalValue: document.getElementById('subtotalValue'),
    discountValue: document.getElementById('discountValue'),
    vatValue: document.getElementById('vatValue'),
    grandTotalValue: document.getElementById('grandTotalValue'),
    previewSubtotal: document.getElementById('previewSubtotal'),
    previewDiscount: document.getElementById('previewDiscount'),
    previewVat: document.getElementById('previewVat'),
    previewGrand: document.getElementById('previewGrand'),
    printableInvoice: document.getElementById('printableInvoice'),
    settingsCard: document.getElementById('settingsCard'),
    profileProtectionStatus: document.getElementById('profileProtectionStatus'),
    enableProtectionBtn: document.getElementById('enableProtectionBtn'),
    unlockProfileBtn: document.getElementById('unlockProfileBtn'),
    changePasswordBtn: document.getElementById('changePasswordBtn'),
    removePasswordBtn: document.getElementById('removePasswordBtn'),
    resetProfileBtn: document.getElementById('resetProfileBtn'),
    setupModal: document.getElementById('setupModal'),
    setupBusinessName: document.getElementById('setupBusinessName'),
    setupLogoUpload: document.getElementById('setupLogoUpload'),
    setupAddress: document.getElementById('setupAddress'),
    setupPhone: document.getElementById('setupPhone'),
    setupEmail: document.getElementById('setupEmail'),
    setupWebsite: document.getElementById('setupWebsite'),
    setupVat: document.getElementById('setupVat'),
    setupReg: document.getElementById('setupReg'),
    setupBankName: document.getElementById('setupBankName'),
    setupAccountName: document.getElementById('setupAccountName'),
    setupAccountNumber: document.getElementById('setupAccountNumber'),
    setupBranchCode: document.getElementById('setupBranchCode'),
    setupPaymentReference: document.getElementById('setupPaymentReference'),
    setupPaymentTerms: document.getElementById('setupPaymentTerms'),
    setupPrefix: document.getElementById('setupPrefix'),
    setupCurrency: document.getElementById('setupCurrency'),
    saveSetupBtn: document.getElementById('saveSetupBtn'),
    skipSetupBtn: document.getElementById('skipSetupBtn'),
    protectionChoiceModal: document.getElementById('protectionChoiceModal'),
    continueNoPasswordBtn: document.getElementById('continueNoPasswordBtn'),
    protectWithPasswordBtn: document.getElementById('protectWithPasswordBtn'),
    passwordModal: document.getElementById('passwordModal'),
    passwordModalHeading: document.getElementById('passwordModalHeading'),
    profilePassword: document.getElementById('profilePassword'),
    profilePasswordConfirm: document.getElementById('profilePasswordConfirm'),
    savePasswordBtn: document.getElementById('savePasswordBtn'),
    cancelPasswordBtn: document.getElementById('cancelPasswordBtn'),
    verifyPasswordModal: document.getElementById('verifyPasswordModal'),
    verifyProfilePassword: document.getElementById('verifyProfilePassword'),
    verifyPasswordBtn: document.getElementById('verifyPasswordBtn'),
    cancelVerifyBtn: document.getElementById('cancelVerifyBtn')
  };

  const protectedFieldIds = [
    'businessName',
    'companyAddress',
    'companyPhone',
    'companyEmail',
    'companyWebsite',
    'vatNumber',
    'registrationNumber',
    'bankName',
    'accountName',
    'accountNumber',
    'branchCode',
    'paymentReference',
    'paymentTerms',
    'invoicePrefix',
    'currencySymbol'
  ];

  const previewMap = [
    ['businessName', 'previewBusinessName'],
    ['companyAddress', 'previewCompanyAddress'],
    ['companyPhone', 'previewCompanyPhone'],
    ['companyEmail', 'previewCompanyEmail'],
    ['companyWebsite', 'previewCompanyWebsite'],
    ['vatNumber', 'previewVatNumber'],
    ['registrationNumber', 'previewRegistrationNumber'],
    ['invoiceNumber', 'previewInvoiceNumber'],
    ['invoiceDate', 'previewInvoiceDate'],
    ['dueDate', 'previewDueDate'],
    ['referenceNumber', 'previewReferenceNumber'],
    ['customerName', 'previewCustomerName'],
    ['customerCompany', 'previewCustomerCompany'],
    ['customerAddress', 'previewCustomerAddress'],
    ['customerPhone', 'previewCustomerPhone'],
    ['customerEmail', 'previewCustomerEmail'],
    ['bankName', 'previewBankName'],
    ['accountName', 'previewAccountName'],
    ['accountNumber', 'previewAccountNumber'],
    ['branchCode', 'previewBranchCode'],
    ['paymentReference', 'previewPaymentReference'],
    ['paymentTerms', 'previewPaymentTerms'],
    ['notes', 'previewNotes'],
    ['terms', 'previewTerms'],
    ['thankYouMessage', 'previewThanks']
  ];

  let autosaveTimer;
  let passwordAction = null;

  function parseJson(text) {
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  }

  function showModal(modal) {
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  function hideModal(modal) {
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  function isProfileProtectionEnabled() {
    return localStorage.getItem(STORAGE_KEYS.profileProtectionEnabled) === 'yes';
  }

  function isProfileUnlocked() {
    return sessionStorage.getItem(SESSION_KEYS.profileUnlocked) === 'yes';
  }

  function setProfileUnlocked(value) {
    sessionStorage.setItem(SESSION_KEYS.profileUnlocked, value ? 'yes' : 'no');
  }

  function canEditProfile() {
    return !isProfileProtectionEnabled() || isProfileUnlocked();
  }

  function getCurrencySymbol() {
    const value = dom.currencySymbol.value;
    if (value === 'EUR') {
      return 'EUR ';
    }
    if (value === 'GBP') {
      return 'GBP ';
    }
    if (value === 'ZAR') {
      return 'R ';
    }
    return '$ ';
  }

  function formatMoney(value) {
    const amount = Number(value) || 0;
    return `${getCurrencySymbol()}${amount.toFixed(2)}`;
  }

  function getCounter() {
    const fromStorage = Number(localStorage.getItem(STORAGE_KEYS.invoiceCounter));
    return Number.isFinite(fromStorage) && fromStorage >= 1 ? fromStorage : DEFAULTS.counter;
  }

  function setCounter(value) {
    localStorage.setItem(STORAGE_KEYS.invoiceCounter, String(value));
  }

  function getInvoicePrefix() {
    const raw = String(dom.invoicePrefix.value || '').trim();
    return raw || DEFAULTS.invoicePrefix;
  }

  function generateInvoiceNumber() {
    const next = getCounter();
    setCounter(next + 1);
    return `${getInvoicePrefix()}-${String(next).padStart(5, '0')}`;
  }

  function assignNewInvoiceNumber() {
    dom.invoiceNumber.value = generateInvoiceNumber();
  }

  function setDefaultDates() {
    const today = new Date();
    const due = new Date();
    due.setDate(today.getDate() + 14);
    dom.invoiceDate.value = today.toISOString().slice(0, 10);
    dom.dueDate.value = due.toISOString().slice(0, 10);
  }

  function getItemRows() {
    return Array.from(dom.itemsBody.querySelectorAll('tr'));
  }

  function createCellInput(className, type, value, min, step) {
    const input = document.createElement('input');
    input.className = className;
    input.type = type;
    input.value = value;
    if (typeof min !== 'undefined') {
      input.min = String(min);
    }
    if (typeof step !== 'undefined') {
      input.step = String(step);
    }
    if (type !== 'number') {
      input.required = true;
    }
    return input;
  }

  function extractRowData(tr) {
    return {
      description: tr.querySelector('.item-description').value,
      quantity: tr.querySelector('.item-qty').value,
      unitPrice: tr.querySelector('.item-price').value,
      discount: tr.querySelector('.item-discount').value,
      vat: tr.querySelector('.item-vat').value
    };
  }

  function addItemRow(itemData) {
    const data = Object.assign({}, DEFAULTS.item, itemData || {});
    const tr = document.createElement('tr');
    tr.innerHTML = [
      '<td></td>',
      '<td></td>',
      '<td></td>',
      '<td></td>',
      '<td></td>',
      '<td></td>',
      '<td class="no-print"></td>'
    ].join('');

    const description = createCellInput('item-description', 'text', data.description);
    const quantity = createCellInput('item-qty', 'number', data.quantity, 0, 0.01);
    const unitPrice = createCellInput('item-price', 'number', data.unitPrice, 0, 0.01);
    const discount = createCellInput('item-discount', 'number', data.discount, 0, 100);
    const vat = createCellInput('item-vat', 'number', data.vat, 0, 100);
    const lineTotal = createCellInput('item-total', 'number', '0.00', 0, 0.01);

    lineTotal.readOnly = true;
    lineTotal.tabIndex = -1;

    tr.children[0].appendChild(description);
    tr.children[1].appendChild(quantity);
    tr.children[2].appendChild(unitPrice);
    tr.children[3].appendChild(discount);
    tr.children[4].appendChild(vat);
    tr.children[5].appendChild(lineTotal);

    const actions = document.createElement('div');
    actions.className = 'row-actions';
    const duplicateBtn = document.createElement('button');
    duplicateBtn.type = 'button';
    duplicateBtn.textContent = 'Duplicate';
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    actions.appendChild(duplicateBtn);
    actions.appendChild(removeBtn);
    tr.children[6].appendChild(actions);

    [description, quantity, unitPrice, discount, vat].forEach(function (input) {
      input.addEventListener('input', function () {
        recalculateTotals();
        updatePreview();
      });
    });

    duplicateBtn.addEventListener('click', function () {
      addItemRow(extractRowData(tr));
      recalculateTotals();
      updatePreview();
    });

    removeBtn.addEventListener('click', function () {
      if (getItemRows().length === 1) {
        return;
      }
      tr.remove();
      recalculateTotals();
      updatePreview();
    });

    dom.itemsBody.appendChild(tr);
    recalculateTotals();
    updatePreview();
  }

  function recalculateTotals() {
    let subtotal = 0;
    let discountTotal = 0;
    let vatTotal = 0;
    let grandTotal = 0;

    getItemRows().forEach(function (tr) {
      const qty = Math.max(0, Number(tr.querySelector('.item-qty').value) || 0);
      const price = Math.max(0, Number(tr.querySelector('.item-price').value) || 0);
      const discountPct = Math.min(100, Math.max(0, Number(tr.querySelector('.item-discount').value) || 0));
      const vatPct = Math.min(100, Math.max(0, Number(tr.querySelector('.item-vat').value) || 0));

      const lineBase = qty * price;
      const lineDiscount = lineBase * (discountPct / 100);
      const taxable = lineBase - lineDiscount;
      const lineVat = taxable * (vatPct / 100);
      const lineTotal = taxable + lineVat;

      subtotal += lineBase;
      discountTotal += lineDiscount;
      vatTotal += lineVat;
      grandTotal += lineTotal;

      tr.querySelector('.item-total').value = lineTotal.toFixed(2);
    });

    dom.subtotalValue.textContent = formatMoney(subtotal);
    dom.discountValue.textContent = formatMoney(discountTotal);
    dom.vatValue.textContent = formatMoney(vatTotal);
    dom.grandTotalValue.textContent = formatMoney(grandTotal);
    dom.previewSubtotal.textContent = formatMoney(subtotal);
    dom.previewDiscount.textContent = formatMoney(discountTotal);
    dom.previewVat.textContent = formatMoney(vatTotal);
    dom.previewGrand.textContent = formatMoney(grandTotal);
  }

  function updatePreview() {
    previewMap.forEach(function (pair) {
      const source = document.getElementById(pair[0]);
      const target = document.getElementById(pair[1]);
      if (!source || !target) {
        return;
      }
      target.textContent = source.value || '';
    });

    dom.previewItemsBody.innerHTML = '';
    getItemRows().forEach(function (tr) {
      const row = document.createElement('tr');
      const values = [
        tr.querySelector('.item-description').value,
        tr.querySelector('.item-qty').value,
        formatMoney(tr.querySelector('.item-price').value),
        `${tr.querySelector('.item-discount').value || 0}%`,
        `${tr.querySelector('.item-vat').value || 0}%`,
        formatMoney(tr.querySelector('.item-total').value)
      ];

      values.forEach(function (value) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });

      dom.previewItemsBody.appendChild(row);
    });

    if (!dom.previewItemsBody.children.length) {
      const empty = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 6;
      emptyCell.textContent = 'No line items yet.';
      emptyCell.style.textAlign = 'center';
      empty.appendChild(emptyCell);
      dom.previewItemsBody.appendChild(empty);
    }
  }

  function setLogoPreview(base64Data) {
    if (!base64Data) {
      dom.logoPreview.classList.add('hidden');
      dom.logoPreview.removeAttribute('src');
      return;
    }
    dom.logoPreview.src = base64Data;
    dom.logoPreview.classList.remove('hidden');
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve) {
      if (!file) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        resolve(typeof reader.result === 'string' ? reader.result : '');
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleLogoUpload(event) {
    if (!canEditProfile()) {
      alert('Unlock Business Profile in Settings before editing profile fields.');
      event.target.value = '';
      return;
    }

    const file = event.target.files && event.target.files[0];
    const logoData = await readFileAsDataUrl(file);
    if (!logoData) {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.logoData, logoData);
    setLogoPreview(logoData);
    updatePreview();
    savePersistentDetails();
  }

  function savePersistentDetails() {
    if (!canEditProfile()) {
      return;
    }

    const company = {};
    const payment = {};
    Array.from(document.querySelectorAll('.company-field')).forEach(function (field) {
      company[field.id] = field.value;
    });
    Array.from(document.querySelectorAll('.payment-field')).forEach(function (field) {
      payment[field.id] = field.value;
    });

    localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(company));
    localStorage.setItem(STORAGE_KEYS.payment, JSON.stringify(payment));
    localStorage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({
        currencySymbol: dom.currencySymbol.value,
        invoicePrefix: dom.invoicePrefix.value
      })
    );
  }

  function restorePersistentDetails() {
    const company = parseJson(localStorage.getItem(STORAGE_KEYS.company));
    const payment = parseJson(localStorage.getItem(STORAGE_KEYS.payment));
    const settings = parseJson(localStorage.getItem(STORAGE_KEYS.settings));

    if (company) {
      Object.keys(company).forEach(function (id) {
        const field = document.getElementById(id);
        if (field) {
          field.value = company[id];
        }
      });
    }

    if (payment) {
      Object.keys(payment).forEach(function (id) {
        const field = document.getElementById(id);
        if (field) {
          field.value = payment[id];
        }
      });
    }

    if (settings) {
      if (settings.currencySymbol) {
        dom.currencySymbol.value = settings.currencySymbol;
      }
      if (settings.invoicePrefix) {
        dom.invoicePrefix.value = settings.invoicePrefix;
      }
    }

    const logo = localStorage.getItem(STORAGE_KEYS.logoData);
    if (logo) {
      setLogoPreview(logo);
    }
  }

  function gatherInvoiceData() {
    const values = {};
    Array.from(document.querySelectorAll('input, textarea, select')).forEach(function (field) {
      if (!field.id || field.type === 'file' || field.closest('.modal-overlay')) {
        return;
      }
      values[field.id] = field.value;
    });

    return {
      values: values,
      items: getItemRows().map(function (row) {
        return extractRowData(row);
      }),
      logo: localStorage.getItem(STORAGE_KEYS.logoData) || ''
    };
  }

  function restoreInvoiceData(payload) {
    if (!payload || !payload.values) {
      return;
    }

    Object.keys(payload.values).forEach(function (id) {
      const field = document.getElementById(id);
      if (!field || field.type === 'file') {
        return;
      }
      field.value = payload.values[id];
    });

    dom.itemsBody.innerHTML = '';
    const items = Array.isArray(payload.items) && payload.items.length ? payload.items : [DEFAULTS.item];
    items.forEach(function (item) {
      addItemRow(item);
    });

    if (payload.logo) {
      localStorage.setItem(STORAGE_KEYS.logoData, payload.logo);
      setLogoPreview(payload.logo);
    }

    recalculateTotals();
    updatePreview();
  }

  function isEmailValid(value) {
    if (!value) {
      return true;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isPhoneValid(value) {
    if (!value) {
      return true;
    }
    return /^\+?[0-9()\-\s]{7,20}$/.test(value);
  }

  function isVatValid(value) {
    if (!value) {
      return false;
    }
    return /^[A-Za-z0-9\-\s]{4,24}$/.test(value);
  }

  function renderErrors(errors) {
    dom.errorList.innerHTML = '';
    if (!errors.length) {
      dom.errorPanel.classList.add('hidden');
      return;
    }

    errors.forEach(function (errorText) {
      const li = document.createElement('li');
      li.textContent = errorText;
      dom.errorList.appendChild(li);
    });

    dom.errorPanel.classList.remove('hidden');
  }

  function validateForm() {
    const errors = [];
    const requiredIds = [
      'businessName',
      'companyAddress',
      'companyPhone',
      'companyEmail',
      'vatNumber',
      'registrationNumber',
      'customerName',
      'customerAddress',
      'customerPhone',
      'customerEmail',
      'invoiceNumber',
      'invoiceDate',
      'dueDate',
      'bankName',
      'accountName',
      'accountNumber',
      'branchCode',
      'paymentReference',
      'paymentTerms'
    ];

    requiredIds.forEach(function (id) {
      const field = document.getElementById(id);
      if (field && !String(field.value || '').trim()) {
        const label = document.querySelector(`label[for="${id}"]`);
        const labelText = label ? label.textContent.replace('*', '').trim() : id;
        errors.push(`${labelText} is required.`);
      }
    });

    if (dom.invoiceDate.value && dom.dueDate.value && dom.dueDate.value < dom.invoiceDate.value) {
      errors.push('Due Date cannot be earlier than Invoice Date.');
    }

    if (!isEmailValid(document.getElementById('companyEmail').value.trim())) {
      errors.push('Please enter a valid email address for Company Email.');
    }

    if (!isEmailValid(document.getElementById('customerEmail').value.trim())) {
      errors.push('Please enter a valid email address for Customer Email.');
    }

    if (!isPhoneValid(document.getElementById('companyPhone').value.trim())) {
      errors.push('Please enter a valid phone number for Company Telephone.');
    }

    if (!isPhoneValid(document.getElementById('customerPhone').value.trim())) {
      errors.push('Please enter a valid phone number for Customer Telephone.');
    }

    if (!isVatValid(document.getElementById('vatNumber').value.trim())) {
      errors.push('Please enter a valid VAT Number (4-24 letters, numbers, spaces or hyphens).');
    }

    const rows = getItemRows();
    if (!rows.length) {
      errors.push('At least one line item is required.');
    }

    rows.forEach(function (row, index) {
      const number = index + 1;
      const description = row.querySelector('.item-description').value.trim();
      const qty = Number(row.querySelector('.item-qty').value);
      const price = Number(row.querySelector('.item-price').value);
      const discount = Number(row.querySelector('.item-discount').value);
      const vat = Number(row.querySelector('.item-vat').value);

      if (!description) {
        errors.push(`Line item ${number}: Description is required.`);
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        errors.push(`Line item ${number}: Quantity must be greater than 0.`);
      }
      if (!Number.isFinite(price) || price < 0) {
        errors.push(`Line item ${number}: Unit Price cannot be negative.`);
      }
      if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        errors.push(`Line item ${number}: Discount must be between 0 and 100.`);
      }
      if (!Number.isFinite(vat) || vat < 0 || vat > 100) {
        errors.push(`Line item ${number}: VAT must be between 0 and 100.`);
      }
    });

    renderErrors(errors);
    return !errors.length;
  }

  function clearInvoiceForm() {
    ['customerName', 'customerCompany', 'customerAddress', 'customerPhone', 'customerEmail', 'referenceNumber', 'notes', 'terms', 'thankYouMessage'].forEach(function (id) {
      const field = document.getElementById(id);
      if (field) {
        field.value = '';
      }
    });

    document.getElementById('thankYouMessage').value = 'Thank you for your business.';
    setDefaultDates();
    dom.itemsBody.innerHTML = '';
    addItemRow(DEFAULTS.item);
    renderErrors([]);
    recalculateTotals();
    updatePreview();
  }

  function handleNewInvoice() {
    clearInvoiceForm();
    assignNewInvoiceNumber();
    updatePreview();
  }

  function handleSaveInvoice() {
    if (!validateForm()) {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.currentInvoice, JSON.stringify(gatherInvoiceData()));
    savePersistentDetails();
    alert('Invoice saved successfully on this device.');
  }

  function handleLoadInvoice() {
    const payload = parseJson(localStorage.getItem(STORAGE_KEYS.currentInvoice));
    if (!payload) {
      alert('No saved invoice found in local storage.');
      return;
    }
    restoreInvoiceData(payload);
    renderErrors([]);
    alert('Saved invoice loaded.');
  }

  function handlePrintInvoice() {
    if (!validateForm()) {
      return;
    }
    window.print();
  }

  function handleDownloadPdf() {
    if (!validateForm()) {
      return;
    }
    if (typeof window.html2pdf !== 'function') {
      alert('PDF library is not available. Please check your internet connection and try again.');
      return;
    }

    const fileName = `${dom.invoiceNumber.value || 'invoice'}.pdf`;
    const options = {
      margin: [8, 8, 8, 8],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    window.html2pdf().set(options).from(dom.printableInvoice).save();
  }

  function debounceSave() {
    window.clearTimeout(autosaveTimer);
    autosaveTimer = window.setTimeout(function () {
      savePersistentDetails();
    }, 280);
  }

  function applyProfileLockState() {
    const locked = !canEditProfile();

    protectedFieldIds.forEach(function (id) {
      const field = document.getElementById(id);
      if (!field) {
        return;
      }

      if (field.tagName === 'SELECT') {
        field.disabled = locked;
      } else {
        field.readOnly = locked;
      }

      if (locked) {
        field.classList.add('locked-profile');
      } else {
        field.classList.remove('locked-profile');
      }
    });

    dom.logoUpload.disabled = locked;
  }

  function refreshProtectionUi() {
    const enabled = isProfileProtectionEnabled();
    const unlocked = isProfileUnlocked();

    if (!enabled) {
      dom.profileProtectionStatus.textContent = 'Business Profile protection is disabled.';
      dom.enableProtectionBtn.classList.remove('hidden');
      dom.unlockProfileBtn.classList.add('hidden');
      dom.changePasswordBtn.classList.add('hidden');
      dom.removePasswordBtn.classList.add('hidden');
    } else {
      dom.profileProtectionStatus.textContent = unlocked
        ? 'Business Profile protection is enabled and currently unlocked for this session.'
        : 'Business Profile protection is enabled and currently locked.';
      dom.enableProtectionBtn.classList.add('hidden');
      dom.unlockProfileBtn.classList.toggle('hidden', unlocked);
      dom.changePasswordBtn.classList.remove('hidden');
      dom.removePasswordBtn.classList.remove('hidden');
    }

    applyProfileLockState();
  }

  function toBase64(bytes) {
    let s = '';
    bytes.forEach(function (b) {
      s += String.fromCharCode(b);
    });
    return window.btoa(s);
  }

  function fromBase64(base64) {
    const raw = window.atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
      out[i] = raw.charCodeAt(i);
    }
    return out;
  }

  async function hashPassword(password, saltBytes, iterations) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: saltBytes,
        iterations: iterations
      },
      keyMaterial,
      256
    );
    return new Uint8Array(bits);
  }

  async function storePassword(password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iterations = DEFAULTS.passwordIterations;
    const hash = await hashPassword(password, salt, iterations);

    localStorage.setItem(STORAGE_KEYS.profilePasswordSalt, toBase64(salt));
    localStorage.setItem(STORAGE_KEYS.profilePasswordHash, toBase64(hash));
    localStorage.setItem(STORAGE_KEYS.profilePasswordIterations, String(iterations));
    localStorage.setItem(STORAGE_KEYS.profileProtectionEnabled, 'yes');
    setProfileUnlocked(true);
  }

  async function verifyPassword(password) {
    const hashStored = localStorage.getItem(STORAGE_KEYS.profilePasswordHash);
    const saltStored = localStorage.getItem(STORAGE_KEYS.profilePasswordSalt);
    const iterationsStored = Number(localStorage.getItem(STORAGE_KEYS.profilePasswordIterations)) || DEFAULTS.passwordIterations;

    if (!hashStored || !saltStored) {
      return false;
    }

    const calculated = await hashPassword(password, fromBase64(saltStored), iterationsStored);
    return toBase64(calculated) === hashStored;
  }

  function clearPasswordProtection() {
    localStorage.setItem(STORAGE_KEYS.profileProtectionEnabled, 'no');
    localStorage.removeItem(STORAGE_KEYS.profilePasswordHash);
    localStorage.removeItem(STORAGE_KEYS.profilePasswordSalt);
    localStorage.removeItem(STORAGE_KEYS.profilePasswordIterations);
    setProfileUnlocked(true);
    refreshProtectionUi();
  }

  function validateSetupForm() {
    const required = [
      dom.setupBusinessName,
      dom.setupAddress,
      dom.setupPhone,
      dom.setupEmail,
      dom.setupVat,
      dom.setupReg,
      dom.setupBankName,
      dom.setupAccountName,
      dom.setupAccountNumber,
      dom.setupBranchCode,
      dom.setupPaymentReference,
      dom.setupPaymentTerms
    ];

    if (required.some(function (field) { return !field || !String(field.value || '').trim(); })) {
      alert('Please complete all required Business Profile fields before saving.');
      return false;
    }

    if (!isEmailValid(dom.setupEmail.value.trim())) {
      alert('Please enter a valid business email in setup.');
      return false;
    }

    if (!isPhoneValid(dom.setupPhone.value.trim())) {
      alert('Please enter a valid business phone number in setup.');
      return false;
    }

    if (!isVatValid(dom.setupVat.value.trim())) {
      alert('Please enter a valid VAT Number in setup.');
      return false;
    }

    return true;
  }

  function copySetupToMainFields() {
    document.getElementById('businessName').value = dom.setupBusinessName.value;
    document.getElementById('companyAddress').value = dom.setupAddress.value;
    document.getElementById('companyPhone').value = dom.setupPhone.value;
    document.getElementById('companyEmail').value = dom.setupEmail.value;
    document.getElementById('companyWebsite').value = dom.setupWebsite.value;
    document.getElementById('vatNumber').value = dom.setupVat.value;
    document.getElementById('registrationNumber').value = dom.setupReg.value;
    document.getElementById('bankName').value = dom.setupBankName.value;
    document.getElementById('accountName').value = dom.setupAccountName.value;
    document.getElementById('accountNumber').value = dom.setupAccountNumber.value;
    document.getElementById('branchCode').value = dom.setupBranchCode.value;
    document.getElementById('paymentReference').value = dom.setupPaymentReference.value;
    document.getElementById('paymentTerms').value = dom.setupPaymentTerms.value;
    dom.invoicePrefix.value = String(dom.setupPrefix.value || '').trim() || DEFAULTS.invoicePrefix;
    dom.currencySymbol.value = dom.setupCurrency.value || DEFAULTS.currency;
  }

  async function handleSetupLogoUpload(event) {
    const file = event.target.files && event.target.files[0];
    const logoData = await readFileAsDataUrl(file);
    if (!logoData) {
      return;
    }

    localStorage.setItem(STORAGE_KEYS.logoData, logoData);
    setLogoPreview(logoData);
    updatePreview();
  }

  function resetBusinessProfile() {
    localStorage.removeItem(STORAGE_KEYS.company);
    localStorage.removeItem(STORAGE_KEYS.payment);
    localStorage.removeItem(STORAGE_KEYS.settings);
    localStorage.removeItem(STORAGE_KEYS.logoData);
    localStorage.setItem(STORAGE_KEYS.profileCompleted, 'no');

    ['businessName', 'companyAddress', 'companyPhone', 'companyEmail', 'companyWebsite', 'vatNumber', 'registrationNumber', 'bankName', 'accountName', 'accountNumber', 'branchCode', 'paymentReference', 'paymentTerms'].forEach(function (id) {
      const field = document.getElementById(id);
      if (field) {
        field.value = '';
      }
    });

    dom.invoicePrefix.value = DEFAULTS.invoicePrefix;
    dom.currencySymbol.value = DEFAULTS.currency;
    setLogoPreview('');
    localStorage.removeItem(STORAGE_KEYS.logoData);

    showModal(dom.setupModal);
    updatePreview();
    refreshProtectionUi();
  }

  function startPasswordCreateFlow(title) {
    passwordAction = 'create';
    dom.passwordModalHeading.textContent = title;
    dom.profilePassword.value = '';
    dom.profilePasswordConfirm.value = '';
    showModal(dom.passwordModal);
  }

  function startPasswordVerifyFlow(action) {
    passwordAction = action;
    dom.verifyProfilePassword.value = '';
    showModal(dom.verifyPasswordModal);
  }

  function initializeFirstTimeFlow() {
    const completed = localStorage.getItem(STORAGE_KEYS.profileCompleted) === 'yes';
    if (!completed) {
      setProfileUnlocked(true);
      showModal(dom.setupModal);
    }
  }

  function bindWorkflowEvents() {
    dom.setupLogoUpload.addEventListener('change', handleSetupLogoUpload);

    dom.saveSetupBtn.addEventListener('click', function () {
      if (!validateSetupForm()) {
        return;
      }

      copySetupToMainFields();
      savePersistentDetails();
      localStorage.setItem(STORAGE_KEYS.profileCompleted, 'yes');
      hideModal(dom.setupModal);
      showModal(dom.protectionChoiceModal);
      assignNewInvoiceNumber();
      recalculateTotals();
      updatePreview();
    });

    dom.skipSetupBtn.addEventListener('click', function () {
      localStorage.setItem(STORAGE_KEYS.profileCompleted, 'yes');
      hideModal(dom.setupModal);
      updatePreview();
    });

    dom.continueNoPasswordBtn.addEventListener('click', function () {
      clearPasswordProtection();
      hideModal(dom.protectionChoiceModal);
    });

    dom.protectWithPasswordBtn.addEventListener('click', function () {
      hideModal(dom.protectionChoiceModal);
      startPasswordCreateFlow('Create Business Profile Password');
    });

    dom.savePasswordBtn.addEventListener('click', async function () {
      const password = dom.profilePassword.value;
      const confirm = dom.profilePasswordConfirm.value;

      if (!password || password.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirm) {
        alert('Passwords do not match.');
        return;
      }

      await storePassword(password);
      hideModal(dom.passwordModal);
      refreshProtectionUi();
      alert('Business Profile password saved securely.');
    });

    dom.cancelPasswordBtn.addEventListener('click', function () {
      hideModal(dom.passwordModal);
      passwordAction = null;
      refreshProtectionUi();
    });

    dom.verifyPasswordBtn.addEventListener('click', async function () {
      const password = dom.verifyProfilePassword.value;
      if (!password) {
        alert('Please enter your password.');
        return;
      }

      const ok = await verifyPassword(password);
      if (!ok) {
        alert('Incorrect password. Please try again.');
        return;
      }

      hideModal(dom.verifyPasswordModal);
      dom.verifyProfilePassword.value = '';

      if (passwordAction === 'unlock') {
        setProfileUnlocked(true);
        refreshProtectionUi();
        alert('Business Profile unlocked for this session.');
      }

      if (passwordAction === 'change') {
        setProfileUnlocked(true);
        refreshProtectionUi();
        startPasswordCreateFlow('Change Business Profile Password');
      }

      if (passwordAction === 'remove') {
        clearPasswordProtection();
        alert('Business Profile password removed.');
      }

      passwordAction = null;
    });

    dom.cancelVerifyBtn.addEventListener('click', function () {
      hideModal(dom.verifyPasswordModal);
      passwordAction = null;
      refreshProtectionUi();
    });

    dom.enableProtectionBtn.addEventListener('click', function () {
      startPasswordCreateFlow('Create Business Profile Password');
    });

    dom.unlockProfileBtn.addEventListener('click', function () {
      startPasswordVerifyFlow('unlock');
    });

    dom.changePasswordBtn.addEventListener('click', function () {
      startPasswordVerifyFlow('change');
    });

    dom.removePasswordBtn.addEventListener('click', function () {
      startPasswordVerifyFlow('remove');
    });

    dom.resetProfileBtn.addEventListener('click', function () {
      const ok = window.confirm('Reset saved Business Profile? Existing invoices remain available.');
      if (!ok) {
        return;
      }
      resetBusinessProfile();
    });

    dom.openSettingsBtn.addEventListener('click', function () {
      dom.settingsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function bindMainEvents() {
    dom.addItemBtn.addEventListener('click', function () {
      addItemRow(DEFAULTS.item);
      renderErrors([]);
    });

    dom.newInvoiceBtn.addEventListener('click', handleNewInvoice);
    dom.saveInvoiceBtn.addEventListener('click', handleSaveInvoice);
    dom.loadInvoiceBtn.addEventListener('click', handleLoadInvoice);
    dom.printInvoiceBtn.addEventListener('click', handlePrintInvoice);
    dom.downloadPdfBtn.addEventListener('click', handleDownloadPdf);

    dom.clearInvoiceBtn.addEventListener('click', function () {
      clearInvoiceForm();
      assignNewInvoiceNumber();
      updatePreview();
    });

    dom.logoUpload.addEventListener('change', handleLogoUpload);

    document.querySelectorAll('input, textarea, select').forEach(function (field) {
      if (field.type === 'file' || field.closest('#itemsBody') || field.closest('.modal-overlay')) {
        return;
      }

      field.addEventListener('input', function () {
        if (protectedFieldIds.indexOf(field.id) !== -1 && !canEditProfile()) {
          return;
        }

        if (field.id === 'invoicePrefix' && canEditProfile()) {
          assignNewInvoiceNumber();
        }

        updatePreview();
        recalculateTotals();
        debounceSave();
      });

      field.addEventListener('change', function () {
        if (protectedFieldIds.indexOf(field.id) !== -1 && !canEditProfile()) {
          return;
        }

        updatePreview();
        recalculateTotals();
        debounceSave();
      });
    });
  }

  function bootstrapDefaults() {
    if (!dom.invoicePrefix.value) {
      dom.invoicePrefix.value = DEFAULTS.invoicePrefix;
    }

    if (!dom.invoiceDate.value || !dom.dueDate.value) {
      setDefaultDates();
    }

    if (!dom.invoiceNumber.value) {
      assignNewInvoiceNumber();
    }

    if (localStorage.getItem(STORAGE_KEYS.profileProtectionEnabled) === null) {
      localStorage.setItem(STORAGE_KEYS.profileProtectionEnabled, 'no');
    }

    if (!isProfileProtectionEnabled()) {
      setProfileUnlocked(true);
    }
  }

  function initialize() {
    restorePersistentDetails();
    bootstrapDefaults();
    addItemRow(DEFAULTS.item);

    const savedInvoice = parseJson(localStorage.getItem(STORAGE_KEYS.currentInvoice));
    if (savedInvoice) {
      restoreInvoiceData(savedInvoice);
    }

    bindMainEvents();
    bindWorkflowEvents();
    refreshProtectionUi();
    initializeFirstTimeFlow();
    recalculateTotals();
    updatePreview();
  }

  initialize();
})();
