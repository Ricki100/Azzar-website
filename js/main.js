/* ============================================
   AZZAR FENCING AND STEEL — Main JS
   Animations · Navigation · Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  /* Apache supplies clean extensionless URLs on the live site. When designers
     open index.html directly from Windows, reproduce that routing with real
     .html file targets so local navigation still works. */
  if (window.location.protocol === 'file:') {
    const scriptUrl = document.querySelector('script[src*="js/main.js"]')?.src || new URL('js/main.js', window.location.href).href;
    const siteRoot = new URL('../', scriptUrl);
    document.querySelectorAll('a[href]').forEach(link => {
      const rawHref = link.getAttribute('href');
      if (!rawHref || /^(#|https?:|mailto:|tel:|javascript:)/i.test(rawHref)) return;

      const parts = rawHref.match(/^([^?#]*)([?#].*)?$/);
      const path = parts?.[1] || '';
      const suffix = parts?.[2] || '';
      if (!path) return;

      const finalSegment = path.replace(/\/$/, '').split('/').pop() || '';
      if (finalSegment.includes('.')) return;

      const localPath = path.endsWith('/') ? `${path}index.html` : `${path}.html`;
      const localUrl = path.startsWith('/')
        ? new URL(localPath.slice(1), siteRoot)
        : new URL(localPath, window.location.href);
      link.href = `${localUrl.href}${suffix}`;
    });
  }

  const config = window.AZZAR_CONFIG || {};
  const attributionKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid','fbclid'];
  const ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
  const attributionSavedAt = Number(localStorage.getItem('azzar_attribution_saved_at') || 0);
  if (attributionSavedAt && Date.now() - attributionSavedAt > ATTRIBUTION_TTL_MS) {
    attributionKeys.forEach(key => localStorage.removeItem(`azzar_${key}`));
    localStorage.removeItem('azzar_first_page');
    localStorage.removeItem('azzar_first_referrer');
    localStorage.removeItem('azzar_attribution_saved_at');
  }
  const query = new URLSearchParams(window.location.search);
  const attribution = {};
  attributionKeys.forEach(key => {
    const incoming = query.get(key);
    if (incoming) {
      localStorage.setItem(`azzar_${key}`, incoming);
      localStorage.setItem('azzar_attribution_saved_at', String(Date.now()));
    }
    attribution[key] = incoming || localStorage.getItem(`azzar_${key}`) || '';
  });
  if (!localStorage.getItem('azzar_first_page')) {
    localStorage.setItem('azzar_first_page', window.location.pathname);
    localStorage.setItem('azzar_first_referrer', document.referrer || 'direct');
  }
  const track = (eventName, details = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...details });
  };
  document.querySelectorAll('[data-track]').forEach(el => {
    el.addEventListener('click', () => track(el.dataset.track, { link_url: el.href || '' }));
  });
  document.querySelectorAll('[data-current-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---- Latest blog posts now handled by assets/js/cms-public.js
     (Supabase Content CMS) via the data-cms-blog block — no fetch needed here. ---- */

  /* ---- Homepage hero video ---- */
  const heroVideo = document.querySelector('#heroVideo');
  if (heroVideo) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData === true;
    if (!prefersReducedMotion && !saveData) {
      const source = heroVideo.querySelector('source[data-src]');
      if (source) {
        source.src = source.dataset.src;
        heroVideo.load();
        heroVideo.play().catch(() => {});
      }
    }
  }

  /* ---- Navigation: Scroll State ---- */
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileNav = document.querySelector('.nav__mobile');
  let menuOpen = false;

  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (hamburger && mobileNav) {
    mobileNav.id = mobileNav.id || 'mobileNavigation';
    hamburger.setAttribute('aria-controls', mobileNav.id);
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.addEventListener('click', () => {
      menuOpen = !menuOpen;
      mobileNav.classList.toggle('open', menuOpen);
      hamburger.setAttribute('aria-expanded', String(menuOpen));
      hamburger.setAttribute('aria-label', menuOpen ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', menuOpen);
      hamburger.querySelectorAll('span').forEach((s, i) => {
        if (menuOpen) {
          if (i === 0) s.style.cssText = 'transform: rotate(45deg) translate(5px, 5px)';
          if (i === 1) s.style.cssText = 'opacity: 0';
          if (i === 2) s.style.cssText = 'transform: rotate(-45deg) translate(5px, -5px)';
        } else {
          s.style.cssText = '';
        }
      });
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuOpen) hamburger.click();
    });
  }

  /* ---- Scroll Reveal ---- */
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  reveals.forEach(el => revealObserver.observe(el));

  /* ---- Staggered Grid Reveals ---- */
  const staggerGroups = document.querySelectorAll('[data-stagger]');
  staggerGroups.forEach(group => {
    const children = group.children;
    Array.from(children).forEach((child, i) => {
      child.classList.add('reveal');
      child.style.transitionDelay = `${i * 0.1}s`;
      revealObserver.observe(child);
    });
  });

  /* ---- Animated Counters ---- */
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'));
        const suffix = el.getAttribute('data-suffix') || '';
        let current = 0;
        const duration = 2000;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.floor(current) + suffix;
          if (current >= target) clearInterval(timer);
        }, 16);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));

  /* ---- FAQ Accordion ---- */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.setAttribute('aria-expanded', 'false');
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(fi => {
          fi.classList.remove('open');
          fi.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  /* ---- Hero Parallax ---- */
  const heroBg = document.querySelector('.hero__bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      heroBg.style.transform = `scale(1.05) translateY(${scrolled * 0.25}px)`;
    }, { passive: true });
  }

  /* ---- Active Nav Link ---- */
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav__link').forEach(link => {
    if (link.getAttribute('href') === currentPath ||
        (currentPath !== '/' && link.getAttribute('href') && currentPath.includes(link.getAttribute('href')))) {
      link.classList.add('active');
    }
  });

  /* ---- Smooth Anchor Scroll ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 100;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---- Contact Form ----
     Contact-page quote form only (product pages use .contact-form for their own
     enquiry card, handled in product-enquiry.js). Same delivery as the product
     form: Web3Forms email + Make webhook in parallel, then WhatsApp hand-off.
     The lead is counted as soon as either channel saves it. */
  const form = document.querySelector('form[data-lead-form="quote"]');
  if (form) {
    const CONTACT_MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/shr3g17dxjjxjlmsp0ri3nfsmd6k4kx7';
    const CONTACT_WEB3FORMS_URL = 'https://api.web3forms.com/submit';
    const CONTACT_WEB3FORMS_ACCESS_KEY = '35b5e383-69c4-4981-8d67-db92ccfb81d4';
    const CONTACT_PRIVACY_VERSION = '2026-09-08';
    const whatsappNumber = config.whatsappNumber || '263775752280';
    const btn = form.querySelector('[type="submit"]');
    const btnHtml = btn.innerHTML;
    let status = form.querySelector('.contact-form-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'contact-form-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      btn.insertAdjacentElement('afterend', status);
    }
    let started = false;
    form.addEventListener('input', () => {
      if (started) return;
      started = true;
      track('quote_form_start', { form_type: 'quote_form' });
    });

    const whatsappLink = data => {
      const lines = [
        'Hello Azzar, I would like a quotation.', '',
        `Name: ${data.full_name}`, `Phone: ${data.phone}`,
        data.email ? `Email: ${data.email}` : '',
        `Location: ${data.location}`,
        data.product ? `Need: ${data.product}` : '',
        data.project_size ? `Size: ${data.project_size}` : '',
        data.details ? `Details: ${data.details}` : '', '',
        'Please advise me on pricing and the next step.'
      ];
      const message = lines.filter((line, i) => line !== '' || i === 1 || i === lines.length - 2).join('\n');
      return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = Object.fromEntries(new FormData(form).entries());
      const consentRecorded = `Service enquiry submitted at ${new Date().toISOString()}; privacy notice version ${CONTACT_PRIVACY_VERSION}`;

      const emailData = new FormData();
      emailData.set('access_key', CONTACT_WEB3FORMS_ACCESS_KEY);
      emailData.set('subject', `New quote request (contact page) — ${data.full_name}`);
      emailData.set('from_name', 'Azzar Contact Page Quote');
      emailData.set('name', data.full_name);
      emailData.set('email', data.email);
      emailData.set('Phone / WhatsApp', data.phone);
      emailData.set('Location', data.location);
      emailData.set('What they need', data.product || 'Not specified');
      emailData.set('Approx. size', data.project_size || 'Not specified');
      emailData.set('Additional details', data.details || 'None provided');
      emailData.set('Email marketing opt-in', data.marketing_consent === 'yes' ? 'Yes' : 'No');
      emailData.set('Consent record', consentRecorded);

      const payload = {
        fullName: data.full_name, phone: data.phone, email: data.email || '',
        location: data.location, requirement: data.product || '', projectSize: data.project_size || '',
        details: data.details || '', serviceConsent: data.service_consent,
        marketingConsent: data.marketing_consent === 'yes', consentRecorded,
        formType: 'contact_page_quote', submittedAt: new Date().toISOString(),
        currentPage: window.location.href,
        landingPage: localStorage.getItem('azzar_first_page') || '',
        firstReferrer: localStorage.getItem('azzar_first_referrer') || '',
        leadStage: 'New Enquiry', ...attribution
      };

      btn.disabled = true;
      btn.textContent = 'Sending…';
      status.classList.remove('is-error');
      status.textContent = 'Please wait while we save your enquiry.';

      const postEmail = async () => {
        const r = await fetch(CONTACT_WEB3FORMS_URL, { method: 'POST', body: emailData });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.success) throw new Error('email_delivery_failed');
      };
      const postMake = async () => {
        const r = await fetch(CONTACT_MAKE_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('automation_delivery_failed');
      };
      const [emailResult, makeResult] = await Promise.allSettled([postEmail(), postMake()]);
      const emailSaved = emailResult.status === 'fulfilled';
      const makeSaved = makeResult.status === 'fulfilled';
      const waUrl = whatsappLink(data);

      if (emailSaved || makeSaved) {
        const channel = emailSaved && makeSaved ? 'email_automation_whatsapp' : emailSaved ? 'email_whatsapp' : 'automation_whatsapp';
        track('generate_lead', { form_type: 'quote_form', product: data.product || '', channel });
        status.textContent = 'Enquiry saved. Opening WhatsApp so you can chat to our team…';
        btn.textContent = 'Enquiry saved';
        window.location.assign(waUrl);
        return;
      }

      status.classList.add('is-error');
      status.innerHTML = `We couldn’t save your enquiry. Please try again or <a href="${waUrl}">continue on WhatsApp</a>.`;
      btn.disabled = false;
      btn.innerHTML = btnHtml;
      track('form_submit_error', { form_type: 'quote_form' });
    });
  }

  /* ---- Ticker Duplicate ---- */
  const tickerTrack = document.querySelector('.ticker__track');
  if (tickerTrack) {
    tickerTrack.innerHTML += tickerTrack.innerHTML;
  }

  const finder = document.querySelector('#solutionFinder');
  if (finder) {
    const steps = Array.from(finder.querySelectorAll('.finder-step'));
    const next = finder.querySelector('.finder-next');
    const back = finder.querySelector('.finder-back');
    const submit = finder.querySelector('.finder-submit');
    const progress = finder.querySelector('.finder-progress span, .ed-form-progress span');
    let activeStep = 0;
    const renderFinder = () => {
      steps.forEach((step, index) => step.classList.toggle('is-active', index === activeStep));
      if (progress) progress.style.width = `${((activeStep + 1) / steps.length) * 100}%`;
      back.hidden = activeStep === 0;
      next.hidden = activeStep === steps.length - 1;
      submit.hidden = activeStep !== steps.length - 1;
    };
    next.addEventListener('click', () => {
      const fields = Array.from(steps[activeStep].querySelectorAll('input,select'));
      if (!fields.every(field => field.checkValidity())) {
        fields.find(field => !field.checkValidity())?.reportValidity();
        return;
      }
      activeStep = Math.min(activeStep + 1, steps.length - 1);
      track('solution_finder_step_complete', { step: activeStep });
      renderFinder();
    });
    back.addEventListener('click', () => { activeStep = Math.max(0, activeStep - 1); renderFinder(); });
    finder.addEventListener('submit', e => {
      e.preventDefault();
      if (!finder.checkValidity()) return finder.reportValidity();
      const data = Object.fromEntries(new FormData(finder).entries());
      const message = `Hello Azzar, I need help with a fencing project.

Name: ${data.name}
Phone: ${data.phone}
Project: ${data.project_type}
Priority: ${data.objective}
Location: ${data.location}
Service: ${data.service}

Please contact me to discuss the right solution.`;
      track('solution_finder_complete', { project_type: data.project_type, objective: data.objective });
      window.open(`https://wa.me/${config.whatsappNumber || '263775752280'}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    });
  }

  /* ---- Nav Dropdowns: Products / Industries ---- */
  const dropdownItems = document.querySelectorAll('.nav__item.has-dropdown');
  const cannotHover = window.matchMedia('(hover: none)').matches;
  const closeAllDropdowns = () => {
    dropdownItems.forEach(item => {
      item.classList.remove('open');
      item.querySelector('.nav__link')?.setAttribute('aria-expanded', 'false');
    });
  };
  dropdownItems.forEach(item => {
    const trigger = item.querySelector('.nav__link');
    const panel = item.querySelector('.nav__dropdown');
    if (!trigger || !panel) return;
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    if (cannotHover) {
      trigger.addEventListener('click', event => {
        if (!item.classList.contains('open')) {
          event.preventDefault();
          closeAllDropdowns();
          item.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    } else {
      item.addEventListener('mouseenter', () => trigger.setAttribute('aria-expanded', 'true'));
      item.addEventListener('mouseleave', () => trigger.setAttribute('aria-expanded', 'false'));
      item.addEventListener('focusin', () => trigger.setAttribute('aria-expanded', 'true'));
      item.addEventListener('focusout', event => {
        if (!item.contains(event.relatedTarget)) trigger.setAttribute('aria-expanded', 'false');
      });
    }
  });
  if (dropdownItems.length) {
    document.addEventListener('click', event => {
      dropdownItems.forEach(item => {
        if (!item.contains(event.target)) {
          item.classList.remove('open');
          item.querySelector('.nav__link')?.setAttribute('aria-expanded', 'false');
        }
      });
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeAllDropdowns();
    });
  }

  /* ---- Mobile Nav Accordion: Products / Industries ---- */
  document.querySelectorAll('.nav__mobile-item').forEach(item => {
    const toggle = item.querySelector('.nav__mobile-toggle');
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', event => {
      event.preventDefault();
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  const loadFacebook = document.querySelector('#loadFacebook');
  if (loadFacebook) {
    loadFacebook.addEventListener('click', () => {
      const frame = document.querySelector('#facebookFrame');
      const consent = document.querySelector('#facebookConsent');
      const pageUrl = encodeURIComponent(config.facebookPage || 'https://www.facebook.com/azzarfencing');
      frame.innerHTML = `<iframe title="Latest posts from Azzar Fencing and Steel on Facebook" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" src="https://www.facebook.com/plugins/page.php?href=${pageUrl}&tabs=timeline&width=500&height=520&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false"></iframe>`;
      frame.hidden = false;
      if (consent) consent.hidden = true;
      track('load_facebook_feed');
    });
  }


  // Floating WhatsApp button on every page (skipped on pages that opt out with
  // <body data-no-wa-float>). Clicks are tracked as whatsapp_click by analytics.js.
  if (!document.body.hasAttribute('data-no-wa-float') && !document.querySelector('.wa-float')) {
    const waNumber = config.whatsappNumber || '263775752280';
    const pageName = (document.title || 'your website').split('|')[0].trim();
    const waText = encodeURIComponent(`Hello Azzar, I'm interested in ${pageName}. Please send me a quote.`);
    const wa = document.createElement('a');
    wa.className = 'wa-float';
    wa.href = `https://wa.me/${waNumber}?text=${waText}`;
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.setAttribute('aria-label', 'Chat with Azzar on WhatsApp');
    wa.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.23-.73-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z"/></svg><span class="wa-float__label">WhatsApp us</span>';
    document.body.appendChild(wa);
  }

});
