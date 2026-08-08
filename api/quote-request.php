<?php
/**
 * Hero "Get a Quote" widget → Brevo contact sync + direct sales notification.
 *
 * Receives { firstName, email, perimeterSize } from js/hero-quote.js. This
 * is a hotter, quote-intent lead than the newsletter popup, so it goes to
 * its own Brevo list (BREVO_QUOTE_LIST_ID) for CRM record-keeping, with its
 * own LEAD_SOURCE. Sales gets notified directly by this script via Brevo's
 * transactional email API — not via a Brevo automation — because automation
 * "Notify by email" steps personalize using the RECIPIENT's own contact
 * attributes, not the lead who triggered it, once the recipient is a fixed
 * address different from the lead. Sending the email ourselves, right here,
 * with the data we already have from the form, sidesteps that entirely.
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
    error_log('Brevo quote-request: api/config.php is missing. Copy config.example.php to config.php and fill in real values.');
    respond(500, ['success' => false, 'message' => 'not_configured']);
}

/** @var array{BREVO_API_KEY:string,BREVO_LIST_ID:int,BREVO_QUOTE_LIST_ID:int} $config */
$config = require $configPath;

$apiKey = (string) ($config['BREVO_API_KEY'] ?? '');
$listId = (int) ($config['BREVO_QUOTE_LIST_ID'] ?? 0);

if ($apiKey === '' || $apiKey === 'your-brevo-api-key-here' || $listId <= 0) {
    error_log('Brevo quote-request: config.php exists but BREVO_API_KEY / BREVO_QUOTE_LIST_ID are not filled in.');
    respond(500, ['success' => false, 'message' => 'not_configured']);
}

$raw = file_get_contents('php://input');
$input = json_decode((string) $raw, true);
if (!is_array($input)) {
    respond(400, ['success' => false, 'message' => 'invalid_request']);
}

$firstName = trim((string) ($input['firstName'] ?? ''));
$email = trim((string) ($input['email'] ?? ''));
$fenceType = trim((string) ($input['fenceType'] ?? ''));
$perimeterSize = trim((string) ($input['perimeterSize'] ?? ''));

// Whitelist — must match the <option> values in index.html exactly. Keeps
// junk/arbitrary strings out of the CRM field.
$allowedFenceTypes = [
    'Clearview Fencing',
    'Diamond Mesh Fencing',
    'Field / Game Fence',
    'Razor Wire',
    'Barbed Wire',
    'Electric Fencing',
    'Not sure - need advice',
];

$allowedSizes = [
    'Under 50m',
    '50m - 100m',
    '100m - 300m',
    '300m - 500m',
    '500m - 1km',
    'Over 1km',
    'Not sure yet',
];

if (
    $firstName === ''
    || $email === ''
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || !in_array($fenceType, $allowedFenceTypes, true)
    || !in_array($perimeterSize, $allowedSizes, true)
) {
    respond(400, ['success' => false, 'message' => 'invalid_input']);
}

if (mb_strlen($firstName) > 100 || mb_strlen($email) > 200) {
    respond(400, ['success' => false, 'message' => 'invalid_input']);
}

// Brevo's "Contact added to a list" automation trigger only fires on the
// transition from not-on-list to on-list. A returning lead (same email,
// new/different quote) is already a list member, so a plain upsert below
// would silently update their record without ever notifying sales again.
// Force that transition every time by removing them from the list first
// (best-effort — fine if they were never on it) immediately before re-adding.
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
        'FIRSTNAME' => $firstName,
        'LEAD_SOURCE' => 'Hero Quick Quote',
        'FENCE_TYPE' => $fenceType,
        'PERIMETER_SIZE' => $perimeterSize,
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
    error_log('Brevo quote-request: cURL error - ' . $curlError);
    respond(502, ['success' => false, 'message' => 'brevo_unreachable']);
}

if ($httpCode < 200 || $httpCode >= 300) {
    error_log('Brevo quote-request: unexpected response ' . $httpCode . ' - ' . $response);
    respond(502, ['success' => false, 'message' => 'brevo_error']);
}

// Contact saved to the CRM successfully — now notify sales directly.
$emailPayload = [
    'sender' => ['name' => 'Azzar Website', 'email' => 'sales@azzar.co.zw'],
    'to' => [['email' => 'sales@azzar.co.zw', 'name' => 'Azzar Sales']],
    'subject' => 'New Quotation Request - ' . $firstName,
    'htmlContent' => '<p><strong>New quote request from the website</strong></p>'
        . '<p>Name: ' . htmlspecialchars($firstName, ENT_QUOTES) . '<br>'
        . 'Email: ' . htmlspecialchars($email, ENT_QUOTES) . '<br>'
        . 'Fence type: ' . htmlspecialchars($fenceType, ENT_QUOTES) . '<br>'
        . 'Perimeter size: ' . htmlspecialchars($perimeterSize, ENT_QUOTES) . '</p>',
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
    error_log('Brevo quote-request: sales notification email failed ' . $mailHttpCode . ' - ' . $mailResponse);
}

respond(200, ['success' => true]);
