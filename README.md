# Azzar Fencing and Steel website

This is a static, multipage sales website for Azzar. It includes product and industry landing pages, project media, a guided solution finder, WhatsApp lead handoff, marketing attribution capture and a consent-based Facebook timeline.

## Daily Facebook updates

The homepage loads no Meta content until the visitor chooses **Show latest posts**. Once selected, the public timeline for `https://www.facebook.com/azzarfencing` is embedded. New public Facebook posts should then appear without editing the website.

Meta can restrict embeds because of page privacy, age/country settings, browser tracking protection or outages. The homepage therefore keeps an Azzar-owned campaign panel and direct Facebook/WhatsApp links as a fallback.

For best results:

1. Keep the Facebook page public.
2. Publish posts as normal page posts, not only short-lived ad variants.
3. Pair every advert with one clear action: request pricing, check availability or book an assessment.
4. Reuse the strongest advert image in the website campaign panel when running a major promotion.

## Marketing automation

Edit `js/marketing-config.js`.

- `whatsappNumber`: lead handoff destination.
- `facebookPage`: page used by the live timeline.
- `webhookUrl`: optional browser-safe Make, Zapier, HubSpot, Zoho or custom lead endpoint.

Never add a private API key to this file. Keep secrets in the receiving automation or server.

Quote submissions include first-page/referrer data, UTM campaign fields, Google click identifiers, current page, timestamp and lead stage. When `webhookUrl` is blank, the form opens a populated WhatsApp conversation instead of pretending that a message was stored.

The website pushes conversion interactions into `window.dataLayer`, ready for Google Tag Manager. Events include `generate_lead`, `click_whatsapp`, `click_call`, `solution_finder_complete`, `form_submit_error` and `load_facebook_feed`.

## Content and media

Website images are stored in `images/`. The Mahetshe Primary School folder contains the real project photographs and video used by the site. Keep filenames stable unless all HTML references are updated.

Do not publish unverified testimonials, quantities, timelines, guarantees or named project locations. The original testimonial section remains hidden until Azzar has written client approval and evidence.

## Launch checklist

- Confirm phone numbers, address, hours and Facebook URL.
- Connect and test the webhook if CRM capture is required.
- Add Google Tag Manager only after analytics and consent decisions are approved.
- Review the privacy notice against the chosen CRM and retention process.
- Obtain client approval for any testimonial before making it visible.
- Test the live Facebook timeline while logged out of Facebook.
- Test all forms and WhatsApp links on a mobile phone.
