/* Azzar product-page enquiries: email/automation capture, then WhatsApp handoff. */
(function () {
  'use strict';

  const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/shr3g17dxjjxjlmsp0ri3nfsmd6k4kx7';
  const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
  const WEB3FORMS_ACCESS_KEY = '35b5e383-69c4-4981-8d67-db92ccfb81d4';
  const WHATSAPP_NUMBER = '263775752280';
  const PRIVACY_VERSION = '2026-09-08';

  const products = {
    'clearview-fencing': {
      name: 'Clearview Fencing',
      needLabel: 'Property or site type',
      needOptions: ['Home or residential estate', 'School or institution', 'Commercial or industrial site', 'Solar installation', 'Other secure perimeter'],
      sizeLabel: 'Approximate perimeter length',
      sizeOptions: ['Under 50 metres', '50–200 metres', '200–500 metres', '500 metres–1 kilometre', 'Over 1 kilometre', 'Not sure yet']
    },
    'diamond-mesh': {
      name: 'Diamond Mesh Fencing',
      needLabel: 'Main use',
      needOptions: ['Residential boundary', 'Farm or livestock area', 'Commercial property', 'Sports or institutional enclosure', 'Other'],
      sizeLabel: 'Approximate perimeter length',
      sizeOptions: ['Under 50 metres', '50–200 metres', '200–500 metres', '500 metres–1 kilometre', 'Over 1 kilometre', 'Not sure yet']
    },
    'field-fence': {
      name: 'Field & Game Fence',
      needLabel: 'What will the fence contain or protect?',
      needOptions: ['Cattle', 'Goats or sheep', 'Game or wildlife', 'Crops or farm boundary', 'Mixed use', 'Not sure—need advice'],
      sizeLabel: 'Approximate fence length',
      sizeOptions: ['Under 200 metres', '200–500 metres', '500 metres–1 kilometre', '1–3 kilometres', 'Over 3 kilometres', 'Not sure yet']
    },
    'razor-wire': {
      name: 'Razor Wire',
      needLabel: 'Installation requirement',
      needOptions: ['Add to an existing fence or wall', 'New high-security perimeter', 'Gate or entrance protection', 'Supply only', 'Not sure—need assessment'],
      sizeLabel: 'Approximate perimeter length',
      sizeOptions: ['Under 50 metres', '50–200 metres', '200–500 metres', '500 metres–1 kilometre', 'Over 1 kilometre', 'Not sure yet']
    },
    'barbed-wire': {
      name: 'Barbed Wire',
      needLabel: 'Main use',
      needOptions: ['Farm boundary', 'Livestock paddock', 'Rural property', 'Security topping', 'Supply only', 'Not sure—need advice'],
      sizeLabel: 'Approximate fence length',
      sizeOptions: ['Under 200 metres', '200–500 metres', '500 metres–1 kilometre', '1–3 kilometres', 'Over 3 kilometres', 'Not sure yet']
    },
    'deformed-bars': {
      name: 'Deformed Bars & Steel',
      needLabel: 'Material requirement',
      needOptions: ['Deformed reinforcing bars', 'Reinforcing mesh', 'Construction mesh', 'Mixed steel order', 'Not sure—need a recommendation'],
      sizeLabel: 'Order stage or quantity',
      sizeOptions: ['Small project or extension', 'House or residential build', 'Commercial construction', 'Bulk or contractor supply', 'Bill of quantities available', 'Not sure yet']
    }
  };

  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const optionMarkup = options => `<option value="">Choose an option</option>${options.map(option => `<option>${escapeHtml(option)}</option>`).join('')}`;
  const track = (event, details = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...details });
  };

  function attribution() {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid'];
    return Object.fromEntries(keys.map(key => [key, localStorage.getItem(`azzar_${key}`) || '']));
  }

  function buildForm(mount, key, product) {
    const fieldId = name => `${key}-${name}`;
    const privacyHref = location.protocol === 'file:' ? '../privacy.html' : '../privacy';
    mount.innerHTML = `<div class="container product-enquiry-grid">
      <div class="product-enquiry-copy">
        <span class="eyebrow">Free project enquiry</span>
        <h2>Get the right ${escapeHtml(product.name)} quote</h2>
        <p>Tell us what you need and where the project is. We’ll save the details for our sales team, then open WhatsApp so you can continue the conversation immediately.</p>
        <ol class="product-enquiry-steps">
          <li><span>1</span><div><strong>Share the essentials</strong><p>Contact, location, scale and intended use.</p></div></li>
          <li><span>2</span><div><strong>Continue on WhatsApp</strong><p>Your answers are carried into a ready-to-send message.</p></div></li>
          <li><span>3</span><div><strong>Confirm the next step</strong><p>Our team can arrange pricing, delivery or a free site assessment.</p></div></li>
        </ol>
      </div>
      <div class="contact-form product-enquiry-card">
        <form class="product-enquiry-form" novalidate>
          <input type="hidden" name="product" value="${escapeHtml(product.name)}">
          <input type="hidden" name="consent_recorded" value="">
          <input type="checkbox" name="botcheck" class="product-enquiry-honeypot" tabindex="-1" autocomplete="off">
          <div class="form-row">
            <div class="form-group"><label for="${fieldId('name')}">Full name *</label><input id="${fieldId('name')}" name="full_name" autocomplete="name" maxlength="120" required></div>
            <div class="form-group"><label for="${fieldId('phone')}">Phone / WhatsApp *</label><input id="${fieldId('phone')}" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="24" placeholder="0775 000 000" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label for="${fieldId('email')}">Email address *</label><input id="${fieldId('email')}" name="email" type="email" autocomplete="email" maxlength="160" required></div>
            <div class="form-group"><label for="${fieldId('location')}">Project location *</label><input id="${fieldId('location')}" name="location" autocomplete="address-level2" maxlength="140" placeholder="e.g. Harare, Bulawayo, Mashonaland" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label for="${fieldId('need')}">${escapeHtml(product.needLabel)} *</label><select id="${fieldId('need')}" name="requirement" required>${optionMarkup(product.needOptions)}</select></div>
            <div class="form-group"><label for="${fieldId('size')}">${escapeHtml(product.sizeLabel)} *</label><select id="${fieldId('size')}" name="project_size" required>${optionMarkup(product.sizeOptions)}</select></div>
          </div>
          <div class="form-group"><label for="${fieldId('timeline')}">When do you need it?</label><select id="${fieldId('timeline')}" name="timeline"><option value="">Choose an option</option><option>As soon as possible</option><option>Within 2–4 weeks</option><option>Within 1–3 months</option><option>Planning and budgeting</option></select></div>
          <div class="form-group"><label for="${fieldId('details')}">Anything else we should know?</label><textarea id="${fieldId('details')}" name="details" maxlength="1200" placeholder="Site conditions, preferred specification, delivery needs, drawings or other helpful detail."></textarea></div>
          <label class="product-enquiry-consent"><input type="checkbox" name="service_consent" value="Yes" required><span>I ask Azzar to save these details and contact me about this enquiry by phone, email or WhatsApp. See the <a href="${privacyHref}">privacy notice</a>.</span></label>
          <button type="submit" class="btn btn-primary product-enquiry-submit"><span>Save details &amp; open WhatsApp</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
          <p class="product-enquiry-note">No spam and no obligation. Required fields help us prepare a useful response.</p>
          <p class="product-enquiry-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    </div>`;
    return mount.querySelector('form');
  }

  function whatsappUrl(product, data) {
    const message = [
      `Hello Azzar, I would like a quote for ${product.name}.`, '',
      `Name: ${data.full_name}`, `Phone: ${data.phone}`, `Email: ${data.email}`,
      `Project location: ${data.location}`, `${product.needLabel}: ${data.requirement}`,
      `${product.sizeLabel}: ${data.project_size}`, `Timeline: ${data.timeline || 'Not specified'}`,
      `Additional details: ${data.details || 'None provided'}`, '',
      'Please advise me on pricing and the next step.'
    ].join('\n');
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  async function postWeb3Forms(formData) {
    const response = await fetch(WEB3FORMS_URL, { method: 'POST', body: formData });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || 'email_delivery_failed');
    return true;
  }

  async function postMake(payload) {
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('automation_delivery_failed');
    return true;
  }

  document.querySelectorAll('[data-product-enquiry]').forEach(mount => {
    const key = mount.dataset.productEnquiry;
    const product = products[key];
    if (!product) return;
    const form = buildForm(mount, key, product);
    const submit = form.querySelector('.product-enquiry-submit');
    const submitLabel = submit.querySelector('span');
    const status = form.querySelector('.product-enquiry-status');
    let started = false;

    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        track('product_quote_form_view', { product: key });
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(mount);

    document.querySelectorAll('a[href="#product-enquiry"]').forEach(link => {
      link.addEventListener('click', () => track('product_quote_cta_click', { product: key }));
    });

    form.addEventListener('input', () => {
      if (started) return;
      started = true;
      track('product_quote_form_start', { product: key });
    }, { once: true });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.checkValidity()) {
        const invalid = form.querySelector(':invalid');
        form.querySelectorAll('[aria-invalid="true"]').forEach(field => field.removeAttribute('aria-invalid'));
        invalid?.setAttribute('aria-invalid', 'true');
        invalid?.focus();
        form.reportValidity();
        track('product_quote_validation_error', { product: key, field: invalid?.name || 'unknown' });
        return;
      }

      form.querySelectorAll('[aria-invalid="true"]').forEach(field => field.removeAttribute('aria-invalid'));

      const consentRecorded = `Service enquiry submitted at ${new Date().toISOString()}; privacy notice version ${PRIVACY_VERSION}`;
      form.elements.consent_recorded.value = consentRecorded;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      if (data.botcheck) return;
      const emailData = new FormData();
      emailData.set('access_key', WEB3FORMS_ACCESS_KEY);
      emailData.set('subject', `New ${product.name} enquiry — ${data.full_name}`);
      emailData.set('from_name', 'Azzar Product Enquiry');
      emailData.set('name', data.full_name);
      emailData.set('email', data.email);
      emailData.set('Phone / WhatsApp', data.phone);
      emailData.set('Product', product.name);
      emailData.set('Project location', data.location);
      emailData.set(product.needLabel, data.requirement);
      emailData.set(product.sizeLabel, data.project_size);
      emailData.set('Timeline', data.timeline || 'Not specified');
      emailData.set('Additional details', data.details || 'None provided');
      emailData.set('Consent record', consentRecorded);
      const payload = {
        fullName: data.full_name,
        phone: data.phone,
        email: data.email,
        location: data.location,
        requirement: data.requirement,
        projectSize: data.project_size,
        timeline: data.timeline,
        details: data.details,
        serviceConsent: data.service_consent,
        consentRecorded,
        formType: 'product_page_enquiry', productKey: key,
        submittedAt: new Date().toISOString(), currentPage: location.href,
        landingPage: localStorage.getItem('azzar_first_page') || '',
        firstReferrer: localStorage.getItem('azzar_first_referrer') || '',
        ...attribution()
      };

      submit.disabled = true;
      submitLabel.textContent = 'Saving your enquiry…';
      status.classList.remove('is-error');
      status.textContent = 'Please wait while we securely record your details.';
      track('product_quote_submit', { product: key });

      const [emailResult, automationResult] = await Promise.allSettled([postWeb3Forms(emailData), postMake(payload)]);
      const emailSaved = emailResult.status === 'fulfilled';
      const automationSaved = automationResult.status === 'fulfilled';

      if (emailSaved || automationSaved) {
        const channel = emailSaved && automationSaved ? 'email_automation_whatsapp' : emailSaved ? 'email_whatsapp' : 'automation_whatsapp';
        track('generate_lead', { form_type: 'product_page_enquiry', product: key, channel });
        track('product_quote_whatsapp_open', { product: key });
        status.textContent = 'Details saved. Opening WhatsApp with your project summary…';
        window.location.assign(whatsappUrl(product, data));
        return;
      }

      const directWhatsApp = whatsappUrl(product, data);
      status.classList.add('is-error');
      status.innerHTML = `We could not save the enquiry. Please try again or <a href="${directWhatsApp}">continue directly on WhatsApp</a>.`;
      submit.disabled = false;
      submitLabel.textContent = 'Save details & open WhatsApp';
      track('form_submit_error', { form_type: 'product_page_enquiry', product: key });
    });
  });
})();
