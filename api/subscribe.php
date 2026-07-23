<?php
/**
 * Homepage lead-magnet popup → Brevo contact sync.
 *
 * Receives { firstName, email } from js/popup.js, validates it, then calls
 * Brevo's Contacts API server-side so the Brevo API key never has to live
 * in public JavaScript. On success the contact is created (or updated if
 * they already exist) and added to the "Azzar Homepage Leads" list; a
 * Brevo automation configured with the "Contact added to a list" trigger
 * on that list is what actually sends the welcome email / guide — that
 * part is configured in the Brevo dashboard, not here.
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
    error_log('Brevo subscribe: api/config.php is missing. Copy config.example.php to config.php and fill in real values.');
    respond(500, ['success' => false, 'message' => 'not_configured']);
}

/** @var array{BREVO_API_KEY:string,BREVO_LIST_ID:int} $config */
$config = require $configPath;

$apiKey = (string) ($config['BREVO_API_KEY'] ?? '');
$listId = (int) ($config['BREVO_LIST_ID'] ?? 0);

if ($apiKey === '' || $apiKey === 'your-brevo-api-key-here' || $listId <= 0) {
    error_log('Brevo subscribe: config.php exists but BREVO_API_KEY / BREVO_LIST_ID are not filled in.');
    respond(500, ['success' => false, 'message' => 'not_configured']);
}

$raw = file_get_contents('php://input');
$input = json_decode((string) $raw, true);
if (!is_array($input)) {
    respond(400, ['success' => false, 'message' => 'invalid_request']);
}

$firstName = trim((string) ($input['firstName'] ?? ''));
$email = trim((string) ($input['email'] ?? ''));
$source = trim((string) ($input['source'] ?? 'Homepage Popup'));
if ($source === '') {
    $source = 'Homepage Popup';
}

if ($firstName === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, ['success' => false, 'message' => 'invalid_input']);
}

// Basic sanity caps — not a substitute for a real rate limiter, but stops
// obviously malformed/abusive payloads before they reach Brevo.
if (mb_strlen($firstName) > 100 || mb_strlen($email) > 200 || mb_strlen($source) > 100) {
    respond(400, ['success' => false, 'message' => 'invalid_input']);
}

$payload = [
    'email' => $email,
    'attributes' => [
        'FIRSTNAME' => $firstName,
        'LEAD_SOURCE' => $source,
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
    error_log('Brevo subscribe: cURL error - ' . $curlError);
    respond(502, ['success' => false, 'message' => 'brevo_unreachable']);
}

// Brevo's documented success response is 201 (new contact). In practice an
// upsert (updateEnabled: true) against an existing contact can also return
// 204. Treat any 2xx as success rather than hardcoding one status code.
if ($httpCode >= 200 && $httpCode < 300) {
    respond(200, ['success' => true]);
}

error_log('Brevo subscribe: unexpected response ' . $httpCode . ' - ' . $response);
respond(502, ['success' => false, 'message' => 'brevo_error']);
