/* ============================================
   AZZAR FENCING AND STEEL — Main JS
   Animations · Navigation · Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const config = window.AZZAR_CONFIG || {};
  const attributionKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid','fbclid'];
  const query = new URLSearchParams(window.location.search);
  const attribution = {};
  attributionKeys.forEach(key => {
    const incoming = query.get(key);
    if (incoming) localStorage.setItem(`azzar_${key}`, incoming);
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

  /* ---- Contact Form ---- */
  const form = document.querySelector('.contact-form form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      btn.textContent = 'Sending...';
      btn.disabled = true;
      const formData = Object.fromEntries(new FormData(form).entries());
      const lead = {
        ...formData, ...attribution,
        landing_page: localStorage.getItem('azzar_first_page') || '',
        first_referrer: localStorage.getItem('azzar_first_referrer') || '',
        current_page: window.location.href,
        timestamp: new Date().toISOString(),
        lead_stage: 'New Enquiry'
      };
      try {
        if (config.webhookUrl) {
          const response = await fetch(config.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
          if (!response.ok) throw new Error('Webhook rejected the enquiry');
          btn.textContent = 'Enquiry sent successfully';
          form.reset();
        } else {
          const summary = Object.entries(formData).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join('\n');
          window.open(`https://wa.me/${config.whatsappNumber || '263775752280'}?text=${encodeURIComponent(`Hello Azzar, I would like a quotation.\n\n${summary}`)}`, '_blank', 'noopener');
          btn.textContent = 'Continue in WhatsApp';
        }
        track('generate_lead', { form_type: 'quote_form', product: formData.product || '' });
      } catch (error) {
        btn.textContent = 'Try again or use WhatsApp';
        btn.disabled = false;
        track('form_submit_error', { form_type: 'quote_form' });
      }
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

});
