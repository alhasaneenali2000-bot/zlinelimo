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

  // Booking form (demo submit handling — no backend wired up)
  const form = document.querySelector('#booking-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const success = document.querySelector('#booking-success');
      if (success) {
        success.classList.add('show');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
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
