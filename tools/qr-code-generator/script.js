const form = document.getElementById('qr-form');
const typeSelect = document.getElementById('qr-type');
const sizeSelect = document.getElementById('qr-size');
const eccSelect = document.getElementById('qr-ecc');
const dynamicFields = document.getElementById('dynamic-fields');
const errorMessage = document.getElementById('error-message');
const statusPill = document.getElementById('status-pill');
const canvas = document.getElementById('qr-canvas');
const emptyState = document.getElementById('empty-state');
const generatedData = document.getElementById('generated-data');
const copyButton = document.getElementById('copy-button');
const downloadPngButton = document.getElementById('download-png');
const downloadSvgButton = document.getElementById('download-svg');
const printButton = document.getElementById('print-button');
const clearButton = document.getElementById('clear-button');
const sampleButton = document.getElementById('sample-button');
const printTypeLabel = document.getElementById('print-type-label');
const printQr = document.getElementById('print-qr');
const printData = document.getElementById('print-data');

const SIZE_OPTIONS = {
  240: 'Small',
  320: 'Medium',
  420: 'Large',
  560: 'Extra Large'
};

const FIELD_SETS = {
  website: [
    { id: 'website-url', label: 'Website URL', type: 'url', placeholder: 'https://example.com', required: true }
  ],
  text: [
    { id: 'text-value', label: 'Text', type: 'textarea', placeholder: 'Enter any message or note here.', required: true }
  ],
  email: [
    { id: 'email-address', label: 'Email Address', type: 'email', placeholder: 'name@example.com', required: true },
    { id: 'email-subject', label: 'Subject', type: 'text', placeholder: 'Subject line' },
    { id: 'email-body', label: 'Message', type: 'textarea', placeholder: 'Write your email body here.' }
  ],
  phone: [
    { id: 'phone-number', label: 'Phone Number', type: 'tel', placeholder: '+1 555 123 4567', required: true }
  ],
  sms: [
    { id: 'sms-number', label: 'Phone Number', type: 'tel', placeholder: '+1 555 123 4567', required: true },
    { id: 'sms-message', label: 'Message', type: 'textarea', placeholder: 'Optional SMS body.' }
  ],
  whatsapp: [
    { id: 'whatsapp-number', label: 'Phone Number', type: 'tel', placeholder: '+1 555 123 4567', required: true },
    { id: 'whatsapp-message', label: 'Message', type: 'textarea', placeholder: 'Optional WhatsApp message.' }
  ],
  wifi: [
    { id: 'wifi-ssid', label: 'Network Name (SSID)', type: 'text', placeholder: 'Office WiFi', required: true },
    { id: 'wifi-security', label: 'Security', type: 'select', options: ['WPA', 'WEP', 'nopass'] },
    { id: 'wifi-password', label: 'Password', type: 'text', placeholder: 'Network password' },
    { id: 'wifi-hidden', label: 'Hidden Network', type: 'checkbox' }
  ],
  contact: [
    { id: 'contact-name', label: 'Full Name', type: 'text', placeholder: 'Jane Doe', required: true },
    { id: 'contact-company', label: 'Company', type: 'text', placeholder: 'QuickTools Studio' },
    { id: 'contact-title', label: 'Job Title', type: 'text', placeholder: 'Product Designer' },
    { id: 'contact-phone', label: 'Phone Number', type: 'tel', placeholder: '+1 555 123 4567' },
    { id: 'contact-email', label: 'Email Address', type: 'email', placeholder: 'jane@example.com' },
    { id: 'contact-website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
    { id: 'contact-address', label: 'Address', type: 'text', placeholder: '123 Main Street, City, Country' }
  ],
  maps: [
    { id: 'maps-location', label: 'Google Maps Location', type: 'text', placeholder: '1600 Amphitheatre Parkway, Mountain View, CA', required: true }
  ]
};

const TYPE_LABELS = {
  website: 'Website URL',
  text: 'Text',
  email: 'Email',
  phone: 'Phone',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  wifi: 'WiFi',
  contact: 'Contact Card',
  maps: 'Google Maps'
};

const SAMPLE_DATA = {
  website: {
    'website-url': 'https://quicktools.dev'
  },
  text: {
    'text-value': 'QuickTools QR Code Generator'
  },
  email: {
    'email-address': 'hello@example.com',
    'email-subject': 'QuickTools QR Generator',
    'email-body': 'Thanks for trying the QR generator.'
  },
  phone: {
    'phone-number': '+1 555 012 3456'
  },
  sms: {
    'sms-number': '+1 555 012 3456',
    'sms-message': 'Meet me at 3 PM.'
  },
  whatsapp: {
    'whatsapp-number': '+1 555 012 3456',
    'whatsapp-message': 'Hello from QuickTools.'
  },
  wifi: {
    'wifi-ssid': 'QuickTools Guest',
    'wifi-security': 'WPA',
    'wifi-password': 'guest-access',
    'wifi-hidden': false
  },
  contact: {
    'contact-name': 'Jordan Carter',
    'contact-company': 'QuickTools Studio',
    'contact-title': 'Creative Lead',
    'contact-phone': '+1 555 012 3456',
    'contact-email': 'jordan@example.com',
    'contact-website': 'https://quicktools.dev',
    'contact-address': '123 Market Street, San Francisco, CA'
  },
  maps: {
    'maps-location': '1600 Amphitheatre Parkway, Mountain View, CA'
  }
};

let currentPayload = '';
let currentSvgMarkup = '';
let livePreviewTimer = null;

function escapeQrValue(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/:/g, '\\:');
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return `https://${trimmed}`;
  }
}

function sanitizePhone(value) {
  return value.replace(/[^\d+]/g, '').trim();
}

function sanitizeWhatsAppNumber(value) {
  return value.replace(/\D/g, '');
}

function isValidUrl(value) {
  try {
    const candidate = normalizeUrl(value);
    if (!candidate) {
      return false;
    }
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7;
}

function getFieldValue(id) {
  const field = form.querySelector(`[name="${id}"]`);
  if (!field) {
    return '';
  }

  if (field.type === 'checkbox') {
    return field.checked;
  }

  return field.value.trim();
}

function renderDynamicFields(type) {
  const fields = FIELD_SETS[type] || [];
  dynamicFields.innerHTML = fields
    .map((field, index) => {
      if (field.type === 'select') {
        return `
          <label class="field ${index === 0 ? 'field-wide' : ''}">
            <span>${field.label}</span>
            <select name="${field.id}" data-live="true">
              ${field.options.map((option) => `<option value="${option}">${option.toUpperCase()}</option>`).join('')}
            </select>
          </label>
        `;
      }

      if (field.type === 'checkbox') {
        return `
          <label class="field checkbox-field">
            <span>${field.label}</span>
            <input name="${field.id}" type="checkbox" data-live="true">
          </label>
        `;
      }

      const inputMarkup = field.type === 'textarea'
        ? `<textarea name="${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} data-live="true"></textarea>`
        : `<input name="${field.id}" type="${field.type}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} data-live="true">`;

      return `
        <label class="field ${field.type === 'textarea' ? 'field-full' : ''}">
          <span>${field.label}${field.required ? ' *' : ''}</span>
          ${inputMarkup}
        </label>
      `;
    })
    .join('');

  if (type === 'wifi') {
    const passwordField = form.querySelector('[name="wifi-password"]');
    const securityField = form.querySelector('[name="wifi-security"]');
    if (passwordField && securityField) {
      const syncWifiPasswordState = () => {
        passwordField.disabled = securityField.value === 'nopass';
        passwordField.placeholder = securityField.value === 'nopass' ? 'Not needed for open networks' : 'Network password';
        if (securityField.value === 'nopass') {
          passwordField.value = '';
        }
      };
      securityField.addEventListener('change', syncWifiPasswordState);
      syncWifiPasswordState();
    }
  }
}

function buildPayload(type) {
  switch (type) {
    case 'website': {
      const value = getFieldValue('website-url');
      if (!value) {
        throw new Error('Website URL is required.');
      }
      if (!isValidUrl(value)) {
        throw new Error('Enter a valid website URL.');
      }
      return normalizeUrl(value);
    }
    case 'text': {
      const value = getFieldValue('text-value');
      if (!value) {
        throw new Error('Text content cannot be empty.');
      }
      return value;
    }
    case 'email': {
      const email = getFieldValue('email-address');
      const subject = getFieldValue('email-subject');
      const body = getFieldValue('email-body');
      if (!email) {
        throw new Error('Email address is required.');
      }
      if (!isValidEmail(email)) {
        throw new Error('Enter a valid email address.');
      }
      let payload = `mailto:${email}`;
      const query = new URLSearchParams();
      if (subject) {
        query.set('subject', subject);
      }
      if (body) {
        query.set('body', body);
      }
      const queryString = query.toString();
      if (queryString) {
        payload += `?${queryString}`;
      }
      return payload;
    }
    case 'phone': {
      const phone = getFieldValue('phone-number');
      if (!phone) {
        throw new Error('Phone number is required.');
      }
      if (!isValidPhone(phone)) {
        throw new Error('Enter a valid phone number.');
      }
      return `tel:${sanitizePhone(phone)}`;
    }
    case 'sms': {
      const phone = getFieldValue('sms-number');
      const message = getFieldValue('sms-message');
      if (!phone) {
        throw new Error('Phone number is required for SMS.');
      }
      if (!isValidPhone(phone)) {
        throw new Error('Enter a valid SMS number.');
      }
      let payload = `sms:${sanitizePhone(phone)}`;
      if (message) {
        payload += `?body=${encodeURIComponent(message)}`;
      }
      return payload;
    }
    case 'whatsapp': {
      const phone = getFieldValue('whatsapp-number');
      const message = getFieldValue('whatsapp-message');
      if (!phone) {
        throw new Error('Phone number is required for WhatsApp.');
      }
      const digits = sanitizeWhatsAppNumber(phone);
      if (digits.length < 7) {
        throw new Error('Enter a valid WhatsApp number.');
      }
      let payload = `https://wa.me/${digits}`;
      if (message) {
        payload += `?text=${encodeURIComponent(message)}`;
      }
      return payload;
    }
    case 'wifi': {
      const ssid = getFieldValue('wifi-ssid');
      const security = getFieldValue('wifi-security') || 'WPA';
      const password = getFieldValue('wifi-password');
      const hidden = getFieldValue('wifi-hidden');
      if (!ssid) {
        throw new Error('Network name is required.');
      }
      if (security !== 'nopass' && !password) {
        throw new Error('WiFi password is required for secured networks.');
      }
      return `WIFI:T:${security};S:${escapeQrValue(ssid)};P:${escapeQrValue(password || '')};H:${hidden ? 'true' : 'false'};;`;
    }
    case 'contact': {
      const name = getFieldValue('contact-name');
      const company = getFieldValue('contact-company');
      const title = getFieldValue('contact-title');
      const phone = getFieldValue('contact-phone');
      const email = getFieldValue('contact-email');
      const website = getFieldValue('contact-website');
      const address = getFieldValue('contact-address');
      if (!name) {
        throw new Error('Full name is required for a contact card.');
      }
      if (email && !isValidEmail(email)) {
        throw new Error('Enter a valid contact email address.');
      }
      if (phone && !isValidPhone(phone)) {
        throw new Error('Enter a valid contact phone number.');
      }
      if (website && !isValidUrl(website)) {
        throw new Error('Enter a valid contact website URL.');
      }
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:;${escapeQrValue(name)};;;`,
        `FN:${escapeQrValue(name)}`
      ];
      if (company) {
        lines.push(`ORG:${escapeQrValue(company)}`);
      }
      if (title) {
        lines.push(`TITLE:${escapeQrValue(title)}`);
      }
      if (phone) {
        lines.push(`TEL;TYPE=CELL:${sanitizePhone(phone)}`);
      }
      if (email) {
        lines.push(`EMAIL:${escapeQrValue(email)}`);
      }
      if (website) {
        lines.push(`URL:${normalizeUrl(website)}`);
      }
      if (address) {
        lines.push(`ADR;TYPE=WORK:;;${escapeQrValue(address)};;;;`);
      }
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    case 'maps': {
      const location = getFieldValue('maps-location');
      if (!location) {
        throw new Error('Google Maps location is required.');
      }
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    }
    default:
      throw new Error('Unsupported QR type.');
  }
}

async function renderQrCode(payload) {
  const size = Number(sizeSelect.value) || 320;
  const ecc = eccSelect.value || 'M';

  await QRCode.toCanvas(canvas, payload, {
    width: size,
    margin: 1,
    errorCorrectionLevel: ecc,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  currentSvgMarkup = await QRCode.toString(payload, {
    type: 'svg',
    width: size,
    margin: 1,
    errorCorrectionLevel: ecc,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  canvas.style.display = 'block';
  emptyState.style.display = 'none';
  copyButton.disabled = false;
  downloadPngButton.disabled = false;
  downloadSvgButton.disabled = false;
  printButton.disabled = false;
  generatedData.value = payload;
  printQr.innerHTML = currentSvgMarkup;
  printData.textContent = payload;
  printTypeLabel.textContent = TYPE_LABELS[typeSelect.value] || 'QR Code';
  statusPill.textContent = `${TYPE_LABELS[typeSelect.value] || 'QR'} ready`;
  currentPayload = payload;
}

function setIdleState(message = 'Waiting for input') {
  currentPayload = '';
  currentSvgMarkup = '';
  canvas.style.display = 'none';
  emptyState.style.display = 'block';
  generatedData.value = '';
  printQr.innerHTML = '';
  printData.textContent = '';
  copyButton.disabled = true;
  downloadPngButton.disabled = true;
  downloadSvgButton.disabled = true;
  printButton.disabled = true;
  statusPill.textContent = message;
}

function showError(message) {
  errorMessage.textContent = message;
  statusPill.textContent = 'Input needs attention';
}

function clearError() {
  errorMessage.textContent = '';
}

function generateQr(manual = false) {
  clearTimeout(livePreviewTimer);

  try {
    const payload = buildPayload(typeSelect.value);
    clearError();
    renderQrCode(payload);
    return true;
  } catch (error) {
    if (manual) {
      showError(error.message);
    } else {
      setIdleState('Fill the current fields');
    }
    return false;
  }
}

function scheduleLivePreview() {
  clearTimeout(livePreviewTimer);
  livePreviewTimer = setTimeout(() => {
    generateQr(false);
  }, 250);
}

function fillSampleData(type) {
  const sample = SAMPLE_DATA[type] || {};
  Object.entries(sample).forEach(([name, value]) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (!field) {
      return;
    }
    if (field.type === 'checkbox') {
      field.checked = Boolean(value);
    } else {
      field.value = value;
    }
  });
  scheduleLivePreview();
}

function clearForm() {
  form.reset();
  typeSelect.value = 'website';
  sizeSelect.value = '320';
  eccSelect.value = 'M';
  renderDynamicFields(typeSelect.value);
  setIdleState('Waiting for input');
  clearError();
}

async function downloadPng() {
  if (!currentPayload) {
    return;
  }
  const dataUrl = await QRCode.toDataURL(currentPayload, {
    width: Number(sizeSelect.value) || 320,
    margin: 1,
    errorCorrectionLevel: eccSelect.value || 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `quicktools-qr-${typeSelect.value}.png`;
  link.click();
}

async function downloadSvg() {
  if (!currentPayload) {
    return;
  }
  const svg = currentSvgMarkup || await QRCode.toString(currentPayload, {
    type: 'svg',
    width: Number(sizeSelect.value) || 320,
    margin: 1,
    errorCorrectionLevel: eccSelect.value || 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `quicktools-qr-${typeSelect.value}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

async function copyGeneratedData() {
  if (!currentPayload) {
    return;
  }
  await navigator.clipboard.writeText(currentPayload);
  statusPill.textContent = 'Generated data copied';
}

function printQrCode() {
  if (!currentPayload) {
    return;
  }
  printQr.innerHTML = currentSvgMarkup;
  printData.textContent = currentPayload;
  printTypeLabel.textContent = TYPE_LABELS[typeSelect.value] || 'QR Code';
  window.print();
}

function populateDefaults() {
  renderDynamicFields(typeSelect.value);
  fillSampleData(typeSelect.value);
}

function bindDynamicInputListeners() {
  dynamicFields.querySelectorAll('[data-live="true"]').forEach((input) => {
    const eventName = input.type === 'checkbox' ? 'change' : 'input';
    input.addEventListener(eventName, scheduleLivePreview);
  });
}

typeSelect.addEventListener('change', () => {
  renderDynamicFields(typeSelect.value);
  bindDynamicInputListeners();
  clearError();
  setIdleState(`Ready for ${TYPE_LABELS[typeSelect.value] || 'QR'} input`);
  scheduleLivePreview();
});

sizeSelect.addEventListener('change', () => {
  if (currentPayload) {
    generateQr(false);
  }
});

eccSelect.addEventListener('change', () => {
  if (currentPayload) {
    generateQr(false);
  }
});

form.addEventListener('input', (event) => {
  const target = event.target;
  if (target && target.matches('[data-live="true"]')) {
    scheduleLivePreview();
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  generateQr(true);
});

clearButton.addEventListener('click', clearForm);
sampleButton.addEventListener('click', () => {
  renderDynamicFields(typeSelect.value);
  bindDynamicInputListeners();
  fillSampleData(typeSelect.value);
});
copyButton.addEventListener('click', () => {
  copyGeneratedData().catch(() => {
    statusPill.textContent = 'Copy failed in this browser';
  });
});
downloadPngButton.addEventListener('click', () => {
  downloadPng().catch(() => {
    statusPill.textContent = 'PNG download failed';
  });
});
downloadSvgButton.addEventListener('click', () => {
  downloadSvg().catch(() => {
    statusPill.textContent = 'SVG download failed';
  });
});
printButton.addEventListener('click', printQrCode);

if (typeof QRCode === 'undefined') {
  statusPill.textContent = 'QR library failed to load';
  showError('The QR library did not load. Check your internet connection and reload the page.');
} else {
  populateDefaults();
  bindDynamicInputListeners();
  setIdleState('Waiting for input');
}
