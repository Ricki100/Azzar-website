/* ============================================
   AZZAR FENCING AND STEEL — Main JS
   Animations · Navigation · Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Navigation: Scroll State ---- */
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileNav = document.querySelector('.nav__mobile');
  let menuOpen = false;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      menuOpen = !menuOpen;
      mobileNav.classList.toggle('open', menuOpen);
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
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(fi => fi.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
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
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      btn.textContent = 'Sending...';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Message Sent! We\'ll call you shortly.';
        btn.style.background = '#73b23d';
        form.reset();
      }, 1800);
    });
  }

  /* ---- Ticker Duplicate ---- */
  const tickerTrack = document.querySelector('.ticker__track');
  if (tickerTrack) {
    tickerTrack.innerHTML += tickerTrack.innerHTML;
  }

});
