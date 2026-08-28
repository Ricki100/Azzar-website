/* ============================================
   AZZAR — Electric Gate Motor landing page
   Quote form → Make.com webhook relay → Brevo (primary)
             → Web3Forms email notification (automatic fallback)

   Primary: Make.com holds the Brevo credential, so the lead gets added to
   Brevo, joins the gate-motor list, and triggers the 5-email nurture
   sequence — no API key lives in this file for that path.

   Fallback: if the Make relay ever fails (outage, misconfig, etc.), the
   same submit automatically retries via Web3Forms so the lead still
   reaches sales by email instead of being lost. Web3Forms' access key is
   designed to be public/client-side (it's a routing ID, not a secret), so
   it's safe to commit here. Fallback leads do NOT get the Brevo/nurture
   treatment — only Make-relayed leads do.
   ============================================ */

const RELAY_WEBHOOK_URL = 'https://hook.eu1.make.com/shr3g17dxjjxjlmsp0ri3nfsmd6k4kx7';
const WEB3FORMS_ACCESS_KEY = '35b5e383-69c4-4981-8d67-db92ccfb81d4';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

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
    // Brevo's WHATSAPP contact attribute rejects anything with spaces,
    // parentheses or dashes — strip everything except digits and a leading
    // "+" so the Make → Brevo CreateContact step doesn't reject the whole
    // contact over formatting (this silently stopped the Make scenario
    // after repeated failures on 2026-08-10).
    const phone = form.phone.value.trim().replace(/[^\d+]/g, '');

    submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending...';
    setStatus('', null);

    const showSuccess = () => {
      if (fieldsWrap) fieldsWrap.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.textContent = `Thanks, ${fullName.split(' ')[0]} — we've got your details and will be in touch shortly to confirm the right motor for your gate.`;
      }
    };

    try {
      const response = await fetch(RELAY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, formType: 'gate_motor_landing_page' })
      });
      if (!response.ok) throw new Error('make_relay_failed');

      showSuccess();
      track('generate_lead', { form_type: 'gate_motor_landing_page', channel: 'make_brevo' });
    } catch (primaryError) {
      try {
        const fallbackResponse = await fetch(WEB3FORMS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            subject: `New Electric Gate Motor Enquiry — ${fullName}`,
            from_name: 'Azzar Website — Electric Gate Motor',
            name: fullName,
            email,
            phone,
            message: `New electric gate motor enquiry from the website (sent via fallback — Make relay was unreachable).\n\nName: ${fullName}\nEmail: ${email}\nPhone/WhatsApp: ${phone}\n\nNext step: confirm gate size/weight to determine D5 vs D10 motor, then book the free site visit.`
          })
        });
        const data = await fallbackResponse.json().catch(() => ({}));
        if (!fallbackResponse.ok || !data.success) throw new Error(data.message || 'fallback_failed');

        showSuccess();
        track('generate_lead', { form_type: 'gate_motor_landing_page', channel: 'web3forms_fallback' });
      } catch (fallbackError) {
        const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello Azzar, I'd like a quote for an electric gate motor. Name: ${fullName}`)}`;
        setStatus(`Something went wrong sending that. Try again, or <a href="${waLink}" target="_blank" rel="noopener">message us on WhatsApp</a> instead.`, 'is-error', true);
        submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Get My Free Quote';
        track('form_submit_error', { form_type: 'gate_motor_landing_page' });
      }
    }
  });
});
