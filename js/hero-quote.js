/* ============================================
   AZZAR FENCING AND STEEL — Hero Quick Quote
   Perimeter size + first name + email → Make.com webhook relay → Brevo
   (primary), Web3Forms email (automatic fallback if Make fails).
   Same architecture as js/gate-quote.js — see that file for the full
   rationale. No API key lives in this file for the primary path.
   ============================================ */

const HERO_RELAY_WEBHOOK_URL = 'https://hook.eu1.make.com/shr3g17dxjjxjlmsp0ri3nfsmd6k4kx7';
const HERO_WEB3FORMS_ACCESS_KEY = '35b5e383-69c4-4981-8d67-db92ccfb81d4';
const HERO_WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

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

    const fenceType = form.fenceType.value;
    const perimeterSize = form.perimeterSize.value;
    const firstName = form.firstName.value.trim();
    const email = form.email.value.trim();

    submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending...';
    setStatus('', null);

    const showSuccess = () => {
      if (row) row.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.textContent = `Thanks — we've got your details and will be in touch about your ${perimeterSize.toLowerCase()} perimeter shortly.`;
      }
    };

    try {
      const response = await fetch(HERO_RELAY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email, fenceType, perimeterSize, formType: 'hero_quick_quote' })
      });
      if (!response.ok) throw new Error('make_relay_failed');

      showSuccess();
      track('generate_lead', {
        form_type: 'hero_quick_quote',
        fence_type: fenceType,
        perimeter_size: perimeterSize,
        channel: 'make_brevo'
      });
    } catch (primaryError) {
      try {
        const fallbackResponse = await fetch(HERO_WEB3FORMS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: HERO_WEB3FORMS_ACCESS_KEY,
            subject: `New Quotation Request — ${firstName}`,
            from_name: 'Azzar Website — Hero Quick Quote',
            name: firstName,
            email,
            message: `New quote request from the website (sent via fallback — Make relay was unreachable).\n\nName: ${firstName}\nEmail: ${email}\nFence type: ${fenceType}\nPerimeter size: ${perimeterSize}`
          })
        });
        const data = await fallbackResponse.json().catch(() => ({}));
        if (!fallbackResponse.ok || !data.success) throw new Error(data.message || 'fallback_failed');

        showSuccess();
        track('generate_lead', { form_type: 'hero_quick_quote', channel: 'web3forms_fallback' });
      } catch (fallbackError) {
        const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello Azzar, I'd like a quote for ${fenceType || 'fencing'} (${perimeterSize || 'size not specified'}). Name: ${firstName}`)}`;
        setStatus(`Something went wrong sending that. Try again, or <a href="${waLink}" target="_blank" rel="noopener">message us on WhatsApp</a> instead.`, 'is-error', true);
        submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Get a Quote';
        track('form_submit_error', { form_type: 'hero_quick_quote' });
      }
    }
  });
});
