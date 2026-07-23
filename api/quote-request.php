<?php
/**
 * Hero "Get a Quote" widget → Brevo contact sync.
 *
 * Receives { firstName, email, perimeterSize } from js/hero-quote.js. This
 * is a hotter, quote-intent lead than the newsletter popup, so it goes to
 * its own Brevo list (BREVO_QUOTE_LIST_ID) with its own LEAD_SOURCE, so
 * Azzar can build a different automation on it (e.g. notify sales + confirm
 * to the customer) instead of the newsletter/guide automation.
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
$perimeterSize = trim((string) ($input['perimeterSize'] ?? ''));

// Whitelist — must match the <option> values in index.html exactly. Keeps
// junk/arbitrary strings out of the CRM field.
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
    || !in_array($perimeterSize, $allowedSizes, true)
) {
    respond(400, ['success' => false, 'message' => 'invalid_input']);
}

if (mb_strlen($firstName) > 100 || mb_strlen($email) > 200) {
    respond(400, ['success' => false, 'message' => 'invalid_input']);
}

$payload = [
    'email' => $email,
    'attributes' => [
        'FIRSTNAME' => $firstName,
        'LEAD_SOURCE' => 'Hero Quick Quote',
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

if ($httpCode >= 200 && $httpCode < 300) {
    respond(200, ['success' => true]);
}

error_log('Brevo quote-request: unexpected response ' . $httpCode . ' - ' . $response);
respond(502, ['success' => false, 'message' => 'brevo_error']);
