/* ============================================
   AZZAR FENCING AND STEEL — Lead Magnet Popup
   Homepage newsletter/guide signup → Make.com webhook relay → Brevo
   (primary), Web3Forms email (automatic fallback if Make fails).
   Same architecture as js/gate-quote.js. The welcome/guide email itself is
   still sent by a Brevo automation on the "Azzar Homepage Leads" list —
   this just needs to get the contact onto that list reliably.
   ============================================ */

const POPUP_RELAY_WEBHOOK_URL = 'https://hook.eu1.make.com/shr3g17dxjjxjlmsp0ri3nfsmd6k4kx7';
const POPUP_WEB3FORMS_ACCESS_KEY = '35b5e383-69c4-4981-8d67-db92ccfb81d4';
const POPUP_WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

document.addEventListener('DOMContentLoaded', () => {
  const popup = document.querySelector('#leadPopup');
  if (!popup) return;

  const config = window.AZZAR_CONFIG || {};
  const whatsappNumber = config.whatsappNumber || '263775752280';

  const STORAGE_LAST_SHOWN = 'azzar_popup_last_shown';
  const STORAGE_SUBSCRIBED = 'azzar_popup_subscribed';
  const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
  const SHOW_AFTER_MS = 20 * 1000; // 20 seconds
  const SCROLL_THRESHOLD = 0.4; // 40% of page

  const track = (eventName, details = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...details });
  };

  // Permanently suppressed after a successful submission.
  if (localStorage.getItem(STORAGE_SUBSCRIBED) === '1') return;

  // Suppressed for 14 days after last being shown (shown, not necessarily submitted).
  const lastShown = parseInt(localStorage.getItem(STORAGE_LAST_SHOWN) || '0', 10);
  if (lastShown && Date.now() - lastShown < COOLDOWN_MS) return;

  const form = popup.querySelector('#popupForm');
  const successView = popup.querySelector('.popup__success');
  const statusEl = popup.querySelector('.popup__status');
  const submitBtn = popup.querySelector('.popup__submit');
  const submitLabel = popup.querySelector('.popup__submit-label');
  let shown = false;

  const openPopup = () => {
    if (shown) return;
    shown = true;
    localStorage.setItem(STORAGE_LAST_SHOWN, String(Date.now()));
    popup.hidden = false;
    popup.setAttribute('aria-hidden', 'false');
    // Force layout before adding the class so the entrance animation plays.
    requestAnimationFrame(() => {
      popup.classList.add('is-open');
      document.body.classList.add('popup-open');
      popup.querySelector('#popupFirstName')?.focus();
    });
    track('popup_shown', { popup_id: 'homepage_lead_magnet' });
    window.removeEventListener('scroll', onScroll);
    clearTimeout(timer);
  };

  const closePopup = () => {
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('popup-open');
    setTimeout(() => { popup.hidden = true; }, 300);
  };

  const onScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const progress = window.scrollY / scrollable;
    if (progress >= SCROLL_THRESHOLD) openPopup();
  };

  const timer = setTimeout(openPopup, SHOW_AFTER_MS);
  window.addEventListener('scroll', onScroll, { passive: true });

  popup.querySelectorAll('[data-popup-dismiss]').forEach(el => {
    el.addEventListener('click', closePopup);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && popup.classList.contains('is-open')) closePopup();
  });

  const setStatus = (message, tone, html) => {
    if (!statusEl) return;
    if (html) statusEl.innerHTML = message;
    else statusEl.textContent = message;
    statusEl.hidden = !message;
    statusEl.classList.remove('is-error', 'is-info');
    if (tone) statusEl.classList.add(tone);
  };

  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const firstName = form.firstName.value.trim();
      const email = form.email.value.trim();
      const marketingConsent = form.marketingConsent.checked;

      submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Sending...';
      setStatus('', null);

      const showSuccess = () => {
        localStorage.setItem(STORAGE_SUBSCRIBED, '1');
        form.hidden = true;
        if (successView) successView.hidden = false;
      };

      try {
        const response = await fetch(POPUP_RELAY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, email, marketingConsent, formType: 'homepage_popup' })
        });
        if (!response.ok) throw new Error('make_relay_failed');

        showSuccess();
        track('generate_lead', { form_type: 'homepage_popup', channel: 'make_brevo' });
      } catch (primaryError) {
        try {
          const fallbackResponse = await fetch(POPUP_WEB3FORMS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              access_key: POPUP_WEB3FORMS_ACCESS_KEY,
              subject: `New Azzar Club Signup — ${firstName}`,
              from_name: 'Azzar Website — Homepage Popup',
              name: firstName,
              email,
              message: `New Azzar Club signup from the website (sent via fallback — Make relay was unreachable).\n\nName: ${firstName}\nEmail: ${email}\n\nNeeds manual add to the "Azzar Homepage Leads" Brevo list.`
            })
          });
          const data = await fallbackResponse.json().catch(() => ({}));
          if (!fallbackResponse.ok || !data.success) throw new Error(data.message || 'fallback_failed');

          showSuccess();
          track('generate_lead', { form_type: 'homepage_popup', channel: 'web3forms_fallback' });
        } catch (fallbackError) {
          const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello Azzar, I tried to join the Azzar Club on your website.')}`;
          setStatus(`Something went wrong sending that. Try again, or <a href="${waLink}" target="_blank" rel="noopener">message us on WhatsApp</a> instead.`, 'is-error', true);
          submitBtn.disabled = false;
          if (submitLabel) submitLabel.textContent = 'Join The Club';
          track('form_submit_error', { form_type: 'homepage_popup' });
        }
      }
    });
  }
});
