<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once '../config/database.php';
require_once '../classes/Reservation.php';

session_start();

// For testing purposes, you can temporarily bypass session check
// Remove this in production
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1; // Temporary test user ID
}

$userId = $_SESSION['user_id'];
$action = isset($_GET['action']) ? $_GET['action'] : '';
$reservationId = isset($_GET['id']) ? $_GET['id'] : null;

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception('Database connection failed');
    }
    
    $reservation = new Reservation($conn);

    switch ($action) {
        case 'details':
            if (!$reservationId) {
                throw new Exception('Reservation ID is required');
            }
            $result = $reservation->getReservationDetails($reservationId, $userId);
            break;

        default:
            $result = $reservation->getUserReservations($userId);
            break;
    }
    
    echo json_encode([
        'status' => 'success',
        'data' => $result
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'trace' => debug_backtrace()
    ]);
}
