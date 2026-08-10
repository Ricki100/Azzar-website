<?php
/**
 * Electric Gate Motor landing page → Brevo contact sync + direct sales notification.
 *
 * Deliberately mirrors api/quote-request.php exactly (same config.php, same
 * BREVO_QUOTE_LIST_ID, same "remove then re-add" trick so repeat enquiries
 * still notify sales, same direct transactional-email notification instead
 * of a Brevo automation). One pipeline, one list, one place for sales to
 * check — the gate-motor form is just a different LEAD_SOURCE and a
 * different set of qualifying attributes on the same list.
 *
 * Deliberately minimal capture: name, email, phone/WhatsApp only. Gate
 * size/weight (which determines D5 vs D10 motor) is confirmed with the lead
 * afterward, not asked on the form — so no custom Brevo attributes are
 * required beyond the built-in WHATSAPP field. LEAD_SOURCE distinguishes
 * this channel from the fencing hero widget on the same list.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'method_not_allowed']);
}

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    error_log('Brevo gate-quote-request: api/config.php is missing. Copy config.example.php to config.php and fill in real values.');
    respond(500, ['success' => false, 'message' => 'not_configured']);
}

/** @var array{BREVO_API_KEY:string,BREVO_LIST_ID:int,BREVO_QUOTE_LIST_ID:int} $config */
$config = require $configPath;

$apiKey = (string) ($config['BREVO_API_KEY'] ?? '');
// Reuses the SAME list as the fencing hero widget on purpose — one CRM list
// ("Azzar Quote Requests") for every quote-intent lead regardless of
// product, distinguished by LEAD_SOURCE. No new Brevo list to create.
$listId = (int) ($config['BREVO_QUOTE_LIST_ID'] ?? 0);

if ($apiKey === '' || $apiKey === 'your-brevo-api-key-here' || $listId <= 0) {
    error_log('Brevo gate-quote-request: config.php exists but BREVO_API_KEY / BREVO_QUOTE_LIST_ID are not filled in.');
    respond(500, ['success' => false, 'message' => 'not_configured']);
}

$raw = file_get_contents('php://input');
$input = json_decode((string) $raw, true);
if (!is_array($input)) {
    respond(400, ['success' => false, 'message' => 'invalid_request']);
}

$fullName = trim((string) ($input['fullName'] ?? ''));
$email = trim((string) ($input['email'] ?? ''));
$phone = trim((string) ($input['phone'] ?? ''));

if (
    $fullName === ''
    || $email === ''
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || $phone === ''
) {
    respond(400, ['success' => false, 'message' => 'invalid_input']);
}

if (mb_strlen($fullName) > 100 || mb_strlen($email) > 200 || mb_strlen($phone) > 40) {
    respond(400, ['success' => false, 'message' => 'invalid_input']);
}

// Force the not-on-list -> on-list transition so a repeat enquiry (same
// email, different gate detail) still fires a fresh sales notification —
// identical fix to the one shipped for the fencing quote widget on 2026-07-24.
$removeCh = curl_init("https://api.brevo.com/v3/contacts/lists/{$listId}/contacts/remove");
curl_setopt_array($removeCh, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['emails' => [$email]]),
    CURLOPT_HTTPHEADER => [
        'api-key: ' . $apiKey,
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 12,
]);
curl_exec($removeCh);
curl_close($removeCh);

$payload = [
    'email' => $email,
    'attributes' => [
        'FIRSTNAME' => $fullName,
        'LEAD_SOURCE' => 'Electric Gate Landing Page',
        'WHATSAPP' => $phone,
    ],
    'listIds' => [$listId],
    'updateEnabled' => true,
];

$ch = curl_init('https://api.brevo.com/v3/contacts');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        'api-key: ' . $apiKey,
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 12,
]);
$response = curl_exec($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    error_log('Brevo gate-quote-request: cURL error - ' . $curlError);
    respond(502, ['success' => false, 'message' => 'brevo_unreachable']);
}

if ($httpCode < 200 || $httpCode >= 300) {
    error_log('Brevo gate-quote-request: unexpected response ' . $httpCode . ' - ' . $response);
    respond(502, ['success' => false, 'message' => 'brevo_error']);
}

// Contact saved to the CRM successfully — now notify sales directly, same
// direct-send pattern used for the fencing quote widget (no automation
// "Notify by email" step, which mis-personalizes once the recipient isn't
// the lead — see the 2026-07-24 case study entry on this exact bug).
$emailPayload = [
    'sender' => ['name' => 'Azzar Website', 'email' => 'sales@azzar.co.zw'],
    'to' => [['email' => 'sales@azzar.co.zw', 'name' => 'Azzar Sales']],
    'subject' => 'New Electric Gate Motor Enquiry - ' . $fullName,
    'htmlContent' => '<p><strong>New electric gate motor enquiry from the website</strong></p>'
        . '<p>Name: ' . htmlspecialchars($fullName, ENT_QUOTES) . '<br>'
        . 'Email: ' . htmlspecialchars($email, ENT_QUOTES) . '<br>'
        . 'Phone/WhatsApp: ' . htmlspecialchars($phone, ENT_QUOTES) . '</p>'
        . '<p>Next step: confirm gate size/weight to determine D5 vs D10 motor, then book the site visit.</p>',
];

$mailCh = curl_init('https://api.brevo.com/v3/smtp/email');
curl_setopt_array($mailCh, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($emailPayload),
    CURLOPT_HTTPHEADER => [
        'api-key: ' . $apiKey,
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 12,
]);
$mailResponse = curl_exec($mailCh);
$mailHttpCode = (int) curl_getinfo($mailCh, CURLINFO_HTTP_CODE);
curl_close($mailCh);

if ($mailHttpCode < 200 || $mailHttpCode >= 300) {
    error_log('Brevo gate-quote-request: sales notification email failed ' . $mailHttpCode . ' - ' . $mailResponse);
}

respond(200, ['success' => true]);
