/* Azzar analytics bootstrap — external file so the CSP (no inline scripts) allows it.
   GA4 + Microsoft Clarity + Meta Pixel, and forwards site dataLayer events (generate_lead etc.) to GA4.
   generate_lead is also sent to Meta as Lead, and call / WhatsApp / email clicks as Contact. */
(function () {
  'use strict';

  // --- GA4 ---
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-GCTRNZQF2Y');

  // --- Meta Pixel (Azzar Steel, 1353042233345110). Loaded from this external file so the CSP allows it. ---
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', '1353042233345110');
  window.fbq('track', 'PageView');

  // Site scripts push {event: 'name', ...params} objects (GTM style). gtag.js ignores
  // those, so forward them to GA4 as real events.
  var originalPush = window.dataLayer.push.bind(window.dataLayer);
  window.dataLayer.push = function () {
    for (var i = 0; i < arguments.length; i++) {
      var item = arguments[i];
      if (item && typeof item === 'object' && typeof item.event === 'string' &&
          item.event.indexOf('gtm.') !== 0 &&
          Object.prototype.toString.call(item) === '[object Object]') {
        var params = {};
        for (var k in item) { if (k !== 'event') params[k] = item[k]; }
        gtag('event', item.event, params);
        if (item.event === 'generate_lead') {
          window.fbq('track', 'Lead', { content_name: params.form_type || 'website_form', content_category: params.product || '' });
        }
      }
    }
    return originalPush.apply(null, arguments);
  };

  // --- Microsoft Clarity ---
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', 'uy9u1lgfl2');

  // --- Click tracking for call / WhatsApp / email links ---
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var type = href.indexOf('tel:') === 0 ? 'phone_click'
      : /wa\.me|whatsapp/i.test(href) ? 'whatsapp_click'
      : href.indexOf('mailto:') === 0 ? 'email_click' : '';
    if (!type) return;
    gtag('event', type, { link_url: href, page_path: location.pathname });
    window.fbq('track', 'Contact', { content_name: type });
  });
})();
