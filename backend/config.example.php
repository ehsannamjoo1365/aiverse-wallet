<?php
declare(strict_types=1);

/*
 * Copy this file to backend/config.php.
 * Keep config.php outside the public web root and never commit real secrets.
 */
return [
    'db' => [
        'dsn' => 'mysql:host=127.0.0.1;dbname=aiverse_wallet;charset=utf8mb4',
        'username' => 'aiverse_app',
        'password' => 'CHANGE_THIS_DATABASE_PASSWORD',
    ],

    // Exact origin of the frontend, with scheme and no trailing slash.
    'app_origin' => 'https://bestapplicationes.atwebpages.com',

    // Generate with: php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
    // Use a unique random value per environment. Never reuse this example.
    'app_key' => 'REPLACE_WITH_64_OR_MORE_HEX_CHARACTERS_FROM_RANDOM_BYTES',

    'session_name' => '__Host-AIVerseSession',
];
