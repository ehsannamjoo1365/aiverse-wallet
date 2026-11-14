<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/src/bootstrap.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store, private');

enforce_origin();
start_app_session();

$action = $_GET['action'] ?? '';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && $action === 'csrf') {
    json_response(['csrf_token' => new_csrf_token()]);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && $action === 'me') {
    if (empty($_SESSION['user_id'])) {
        json_response(['authenticated' => false], 200);
    }

    $stmt = db()->prepare('SELECT id, email, created_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => (int)$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        $_SESSION = [];
        session_regenerate_id(true);
        json_response(['authenticated' => false], 200);
    }

    json_response([
        'authenticated' => true,
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'created_at' => $user['created_at'],
        ],
    ]);
}

require_post();
require_csrf();
$data = request_json();

if ($action === 'register') {
    require_argon2id();

    $email = strtolower(trim((string)($data['email'] ?? '')));
    $password = (string)($data['password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
        json_response(['error' => 'Enter a valid email address.'], 422);
    }
    if (strlen($password) < 12 || strlen($password) > 1024) {
        json_response(['error' => 'Password must contain at least 12 characters.'], 422);
    }

    $hash = password_hash($password, PASSWORD_ARGON2ID);
    if (!is_string($hash)) {
        json_response(['error' => 'Could not securely process the password.'], 500);
    }

    try {
        $stmt = db()->prepare('INSERT INTO users (email, password_hash) VALUES (:email, :hash)');
        $stmt->execute(['email' => $email, 'hash' => $hash]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            json_response(['error' => 'An account with these details may already exist.'], 409);
        }
        throw $e;
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)db()->lastInsertId();
    json_response([
        'authenticated' => true,
        'user' => ['id' => (int)$_SESSION['user_id'], 'email' => $email],
        'csrf_token' => new_csrf_token(),
    ], 201);
}

if ($action === 'login') {
    require_argon2id();

    $email = strtolower(trim((string)($data['email'] ?? '')));
    $password = (string)($data['password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '' || strlen($password) > 1024) {
        json_response(['error' => 'Invalid email or password.'], 401);
    }

    rate_limit_login($email);

    $stmt = db()->prepare('SELECT id, email, password_hash FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_response(['error' => 'Invalid email or password.'], 401);
    }

    if (password_needs_rehash($user['password_hash'], PASSWORD_ARGON2ID)) {
        $newHash = password_hash($password, PASSWORD_ARGON2ID);
        $update = db()->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
        $update->execute(['hash' => $newHash, 'id' => (int)$user['id']]);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];

    json_response([
        'authenticated' => true,
        'user' => ['id' => (int)$user['id'], 'email' => $user['email']],
        'csrf_token' => new_csrf_token(),
    ]);
}

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
    }
    session_destroy();
    json_response(['authenticated' => false]);
}

json_response(['error' => 'Unknown action.'], 404);
