<?php
/**
 * Copy this file to config.php (same folder) and fill in real values.
 *
 * config.php is listed in .gitignore and must NEVER be committed to git or
 * pasted into any public/front-end file. It only needs to exist on the
 * live server.
 */
return [
    // Brevo (formerly Sendinblue) API key.
    // Brevo dashboard → Settings (gear icon) → SMTP & API → API Keys → Generate a new key.
    // The key must have access to Contacts.
    'BREVO_API_KEY' => 'your-brevo-api-key-here',

    // Numeric ID of the "Azzar Homepage Leads" list in Brevo (newsletter/guide
    // popup signups). Create the list first: Contacts → Lists → Create a
    // list → name it "Azzar Homepage Leads". Open the list and copy the ID
    // shown in the page (or in the URL, e.g. .../lists/123 → the ID is 123).
    'BREVO_LIST_ID' => 0,

    // Numeric ID of a SEPARATE list for the hero "Get a Quote" widget — these
    // are hotter, quote-intent leads and should get their own automation
    // (e.g. notify sales) rather than the newsletter one. Create a second
    // list, e.g. "Azzar Quote Requests", and put its ID here. If you'd
    // rather both forms feed the same list, just use the same ID as above.
    'BREVO_QUOTE_LIST_ID' => 0,
];
