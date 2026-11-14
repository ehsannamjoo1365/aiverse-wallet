<?php
declare(strict_types=1);

$configFile = dirname(__DIR__) . '/config.php';
if (!is_file($configFile)) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Backend is not configured.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configFile;
if (!is_array($config)
    || empty($config['db']['dsn'])
    || !isset($config['db']['username'], $config['db']['password'])
    || empty($config['app_origin'])
    || empty($config['app_key'])
    || !preg_match('/\\A[a-f0-9]{64,}\\z/i', (string)$config['app_key'])
) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Backend configuration is invalid.'], JSON_UNESCAPED_UNICODE);
    exit;
}

function json_response(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    header('Pragma: no-cache');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function app_config(): array
{
    global $config;
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $db = app_config()['db'];
    $pdo = new PDO($db['dsn'], $db['username'], $db['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function enforce_origin(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && !hash_equals(app_config()['app_origin'], $origin)) {
        json_response(['error' => 'Origin is not allowed.'], 403);
    }
}

function start_app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['SERVER_PORT'] ?? '') === '443');

    if (!$isHttps) {
        json_response(['error' => 'HTTPS is required.'], 400);
    }

    session_name(app_config()['session_name'] ?? '__Host-AIVerseSession');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_trans_sid', '0');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);

    if (!session_start()) {
        json_response(['error' => 'Could not start a secure session.'], 500);
    }
}

function require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        json_response(['error' => 'Method not allowed.'], 405);
    }
}

function request_json(): array
{
    $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($contentType !== 'application/json') {
        json_response(['error' => 'Content-Type must be application/json.'], 415);
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 8192) {
        json_response(['error' => 'Invalid request body.'], 400);
    }

    try {
        $data = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        json_response(['error' => 'Malformed JSON.'], 400);
    }

    if (!is_array($data)) {
        json_response(['error' => 'A JSON object is required.'], 400);
    }
    return $data;
}

function require_csrf(): void
{
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $expected = $_SESSION['csrf_token'] ?? '';
    if (!is_string($provided) || !is_string($expected)
        || $provided === '' || $expected === ''
        || !hash_equals($expected, $provided)
    ) {
        json_response(['error' => 'CSRF validation failed. Refresh the session and try again.'], 403);
    }
}

function new_csrf_token(): string
{
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf_token'];
}

function require_argon2id(): void
{
    if (!defined('PASSWORD_ARGON2ID')) {
        json_response(['error' => 'This server does not support Argon2id. Authentication is disabled.'], 503);
    }
}

function rate_limit_login(string $email): void
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = hash_hmac('sha256', strtolower($email) . '|' . $ip, app_config()['app_key']);
    $pdo = db();

    $stmt = $pdo->prepare(
        'INSERT INTO auth_rate_limits (bucket_key, window_started_at, attempts)
         VALUES (:key, UTC_TIMESTAMP(), 1)
         ON DUPLICATE KEY UPDATE
           attempts = IF(window_started_at < UTC_TIMESTAMP() - INTERVAL 15 MINUTE, 1, attempts + 1),
           window_started_at = IF(window_started_at < UTC_TIMESTAMP() - INTERVAL 15 MINUTE, UTC_TIMESTAMP(), window_started_at)'
    );
    $stmt->execute(['key' => $key]);

    $check = $pdo->prepare('SELECT attempts FROM auth_rate_limits WHERE bucket_key = :key');
    $check->execute(['key' => $key]);
    $attempts = (int)$check->fetchColumn();

    if ($attempts > 10) {
        header('Retry-After: 900');
        json_response(['error' => 'Too many login attempts. Try again later.'], 429);
    }
}
