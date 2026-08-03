const crypto = require('crypto');

const DISPATCH_EMAIL = 'dispatch@zlinelimousine.net';
const FROM_EMAIL = process.env.QUOTE_FROM_EMAIL || 'Zline Dispatch <quotes@zlinelimousine.net>';

const VEHICLE_CODES = {
  'Executive Sedan (seats 3)': 'SED',
  'Extended SUV (seats 6)': 'SUV',
  'Stretch Limousine (seats 10)': 'LIM',
};

const REQUIRED_FIELDS = ['name', 'phone', 'email', 'service', 'pickup', 'date', 'time'];

function makeInvoiceNumber(vehicle) {
  const code = VEHICLE_CODES[vehicle] || 'GEN';
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${code}-${yy}${mm}${dd}-${suffix}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function sendEmail(apiKey, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured');
    return { statusCode: 500, body: JSON.stringify({ error: 'Email service is not configured.' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  const missing = REQUIRED_FIELDS.filter((field) => !String(data[field] || '').trim());
  if (missing.length) {
    return { statusCode: 400, body: JSON.stringify({ error: `Missing required fields: ${missing.join(', ')}` }) };
  }

  const invoiceNumber = makeInvoiceNumber(data.vehicle);

  const detailRows = [
    ['Reference #', invoiceNumber],
    ['Name', data.name],
    ['Phone', data.phone],
    ['Email', data.email],
    ['Service type', data.service],
    ['Vehicle preference', data.vehicle || 'No preference'],
    ['Pickup', data.pickup],
    ['Drop-off', data.dropoff || '—'],
    ['Date', data.date],
    ['Time', data.time],
    ['Passengers', data.passengers || '—'],
    ['Notes', data.notes || '—'],
  ];

  const detailHtml = detailRows
    .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(label)}</td><td style="padding:4px 0;"><strong>${escapeHtml(value)}</strong></td></tr>`)
    .join('');
  const detailText = detailRows.map(([label, value]) => `${label}: ${value}`).join('\n');

  try {
    await sendEmail(apiKey, {
      from: FROM_EMAIL,
      to: [data.email],
      subject: `Your Zline Austin Limousine quote request — #${invoiceNumber}`,
      html: `<p>Thanks for requesting a quote with Zline Austin Limousine. Your reference number is <strong>${escapeHtml(invoiceNumber)}</strong>.</p>
<p>Dispatch will follow up by phone or email shortly with your fixed quote. For rides in the next 3 hours, call dispatch directly at (512) 555-0142.</p>
<table>${detailHtml}</table>`,
      text: `Thanks for requesting a quote with Zline Austin Limousine. Your reference number is ${invoiceNumber}.\n\nDispatch will follow up by phone or email shortly with your fixed quote. For rides in the next 3 hours, call dispatch directly at (512) 555-0142.\n\n${detailText}`,
    });

    await sendEmail(apiKey, {
      from: FROM_EMAIL,
      to: [DISPATCH_EMAIL],
      reply_to: [data.email],
      subject: `New quote request — #${invoiceNumber} — ${data.service}`,
      html: `<p>New quote request received.</p><table>${detailHtml}</table>`,
      text: `New quote request received.\n\n${detailText}`,
    });
  } catch (err) {
    console.error('Failed to send quote emails:', err);
    return { statusCode: 502, body: JSON.stringify({ error: 'Could not send confirmation email. Please call dispatch directly.' }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, invoiceNumber }),
  };
};
