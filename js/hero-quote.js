/* ============================================
   AZZAR FENCING AND STEEL — Hero Quick Quote
   Perimeter size + first name + email → Brevo
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#heroQuoteForm');
  if (!form) return;

  const config = window.AZZAR_CONFIG || {};
  const whatsappNumber = config.whatsappNumber || '263775752280';

  const track = (eventName, details = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...details });
  };

  const row = form.querySelector('.hero-quote__row');
  const statusEl = form.querySelector('.hero-quote__status');
  const successEl = form.querySelector('.hero-quote__success');
  const submitBtn = form.querySelector('.hero-quote__submit');
  const submitLabel = form.querySelector('.hero-quote__submit-label');

  const setStatus = (message, tone, html) => {
    if (!statusEl) return;
    if (html) statusEl.innerHTML = message;
    else statusEl.textContent = message;
    statusEl.hidden = !message;
    statusEl.classList.remove('is-error');
    if (tone) statusEl.classList.add(tone);
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const perimeterSize = form.perimeterSize.value;
    const firstName = form.firstName.value.trim();
    const email = form.email.value.trim();

    submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending...';
    setStatus('', null);

    try {
      const response = await fetch('/api/quote-request.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email, perimeterSize })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || 'quote_request_failed');

      if (row) row.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.textContent = `Thanks — we've got your details and will be in touch about your ${perimeterSize.toLowerCase()} perimeter shortly.`;
      }
      track('generate_lead', { form_type: 'hero_quick_quote', perimeter_size: perimeterSize });
    } catch (error) {
      const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello Azzar, I'd like a quote for a ${perimeterSize || 'fencing'} perimeter. Name: ${firstName}`)}`;
      setStatus(`Something went wrong sending that. Try again, or <a href="${waLink}" target="_blank" rel="noopener">message us on WhatsApp</a> instead.`, 'is-error', true);
      submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = 'Get a Quote';
      track('form_submit_error', { form_type: 'hero_quick_quote' });
    }
  });
});
