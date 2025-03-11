<?php
session_start();
header('Content-Type: application/json');

// Single response only
echo json_encode([
    'success' => true,
    'isAuthenticated' => true,
    'userData' => [
        'user_id' => isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1
    ]
]);
?>
