// Nav toggle (mobile)
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Departure board: live clock in header + status cycling
  const clock = document.querySelector('[data-board-clock]');
  if (clock) {
    const update = () => {
      const now = new Date();
      const opts = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Chicago' };
      clock.textContent = 'CST ' + new Intl.DateTimeFormat('en-US', opts).format(now);
    };
    update();
    setInterval(update, 30000);
  }

  // Booking form — submits to Netlify Function, which emails the customer and dispatch
  const form = document.querySelector('#booking-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const success = document.querySelector('#booking-success');
      const error = document.querySelector('#booking-error');
      const submitBtn = form.querySelector('button[type="submit"]');
      const data = Object.fromEntries(new FormData(form).entries());

      success?.classList.remove('show');
      error?.classList.remove('show');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      try {
        const res = await fetch('/.netlify/functions/send-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Request failed');

        const invoiceEl = document.querySelector('#booking-invoice');
        if (invoiceEl) invoiceEl.textContent = result.invoiceNumber;
        success?.classList.add('show');
        success?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        form.reset();
      } catch (err) {
        error?.classList.add('show');
        error?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Quote Request';
        }
      }
    });
  }

  // Contact form (demo submit handling)
  const cform = document.querySelector('#contact-form');
  if (cform) {
    cform.addEventListener('submit', (e) => {
      e.preventDefault();
      const success = document.querySelector('#contact-success');
      if (success) {
        success.classList.add('show');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      cform.reset();
    });
  }
});
