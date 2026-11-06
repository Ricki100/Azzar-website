/* Azzar multi-step forms. Any <form data-multistep> whose fields are grouped in
   <fieldset data-step data-step-title="..."> becomes a step-by-step form with a
   progress bar, Back / Next buttons and per-step validation. The final step's
   normal submit button (and each form's own submit handler) is left untouched. */
(function () {
  'use strict';

  const track = (event, details) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event }, details || {}));
  };

  function init(form) {
    if (!form || form.dataset.msReady) return;
    const steps = Array.from(form.querySelectorAll('[data-step]'));
    if (steps.length < 2) return;
    form.dataset.msReady = '1';
    form.classList.add('ms-form');
    const total = steps.length;
    const formType = form.dataset.multistep || 'quote_form';
    let current = 0;
    let furthest = 0;

    const progress = document.createElement('div');
    progress.className = 'ms-progress';
    progress.innerHTML = '<p class="ms-progress-text" aria-live="polite"></p><div class="ms-progress-bar" aria-hidden="true"><span></span></div>';
    steps[0].parentNode.insertBefore(progress, steps[0]);
    const progressText = progress.querySelector('.ms-progress-text');
    const progressBar = progress.querySelector('.ms-progress-bar span');

    const button = (label, cls) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.innerHTML = label;
      return b;
    };
    const arrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

    steps.forEach((step, index) => {
      const nav = document.createElement('div');
      nav.className = 'ms-nav';
      if (index < total - 1) {
        const next = button(`<span>Next</span>${arrow}`, 'btn btn-primary ms-next');
        next.addEventListener('click', goNext);
        nav.appendChild(next);
      }
      if (index > 0) {
        const back = button('Back', 'ms-back');
        back.addEventListener('click', () => show(current - 1, true));
        nav.appendChild(back);
      }
      step.appendChild(nav);
    });

    function fieldsOf(step) {
      return Array.from(step.querySelectorAll('input, select, textarea'))
        .filter(field => field.type !== 'hidden' && !field.closest('.product-enquiry-honeypot') && field.name !== 'botcheck');
    }

    function validStep() {
      const fields = fieldsOf(steps[current]);
      fields.forEach(field => field.removeAttribute('aria-invalid'));
      for (const field of fields) {
        if (!field.checkValidity()) {
          const group = field.type === 'radio' ? steps[current].querySelectorAll(`[name="${field.name}"]`) : [field];
          group.forEach(f => f.setAttribute('aria-invalid', 'true'));
          field.reportValidity();
          field.focus();
          track('quote_form_step_error', { form_type: formType, step: current + 1, field: field.name || 'unknown' });
          return false;
        }
      }
      return true;
    }

    function show(index, moveFocus) {
      current = Math.max(0, Math.min(total - 1, index));
      steps.forEach((step, i) => { step.hidden = i !== current; });
      const title = steps[current].dataset.stepTitle || '';
      progressText.textContent = `Step ${current + 1} of ${total}${title ? ' · ' + title : ''}`;
      progressBar.style.width = `${Math.round(((current + 1) / total) * 100)}%`;
      if (moveFocus) {
        const top = form.getBoundingClientRect().top;
        if (top < 80) window.scrollTo({ top: window.scrollY + top - 110, behavior: 'smooth' });
        const first = fieldsOf(steps[current])[0];
        if (first) first.focus({ preventScroll: true });
      }
      if (current > furthest) {
        furthest = current;
        track('quote_form_step', { form_type: formType, step: current + 1, step_name: title });
      }
    }

    function goNext() {
      if (!validStep()) return;
      show(current + 1, true);
    }

    // Enter on an early step moves forward instead of submitting the whole form.
    // Capture phase on the form itself runs before the form's own submit handler.
    form.addEventListener('submit', event => {
      if (current < total - 1) {
        event.preventDefault();
        event.stopImmediatePropagation();
        goNext();
      }
    }, true);

    // Choosing an option card on the first step moves straight on when it is the step's only required field.
    steps.forEach((step, index) => {
      if (index === total - 1 || !step.hasAttribute('data-step-auto')) return;
      step.addEventListener('change', event => {
        if (event.target.type === 'radio' && index === current) setTimeout(goNext, 180);
      });
    });

    show(0, false);
  }

  document.querySelectorAll('form[data-multistep]').forEach(init);
  window.AzzarMultiStep = { init };
})();
