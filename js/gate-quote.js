/* ============================================
   AZZAR — Electric Gate Motor landing page
   Quote form → same-origin PHP endpoint → Brevo
   No API key, webhook credential or other secret lives in public JavaScript.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#gateQuoteForm');
  if (!form) return;

  const config = window.AZZAR_CONFIG || {};
  const whatsappNumber = config.whatsappNumber || '263775752280';

  const track = (eventName, details = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...details });
  };

  const fieldsWrap = form.querySelector('.gate-quote__fields');
  const statusEl = form.querySelector('.gate-quote__status');
  const successEl = form.querySelector('.gate-quote__success');
  const submitBtn = form.querySelector('.gate-quote__submit');
  const submitLabel = form.querySelector('.gate-quote__submit-label');

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

    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();

    submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending...';
    setStatus('', null);

    try {
      const response = await fetch('/api/gate-quote-request.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, formType: 'gate_motor_landing_page' })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || 'gate_quote_request_failed');

      if (fieldsWrap) fieldsWrap.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.textContent = `Thanks, ${fullName.split(' ')[0]} — we've got your details and will be in touch shortly to confirm the right motor for your gate.`;
      }
      track('generate_lead', { form_type: 'gate_motor_landing_page' });
    } catch (error) {
      const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello Azzar, I'd like a quote for an electric gate motor. Name: ${fullName}`)}`;
      setStatus(`Something went wrong sending that. Try again, or <a href="${waLink}" target="_blank" rel="noopener">message us on WhatsApp</a> instead.`, 'is-error', true);
      submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = 'Get My Free Quote';
      track('form_submit_error', { form_type: 'gate_motor_landing_page' });
    }
  });
});
