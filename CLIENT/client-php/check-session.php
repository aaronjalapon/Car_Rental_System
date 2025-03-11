<?php
session_start();

// Check if user is logged in and has customer info
if (!isset($_SESSION['email']) || !isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Please log in to make a reservation'
    ]);
    exit;
}
?>
