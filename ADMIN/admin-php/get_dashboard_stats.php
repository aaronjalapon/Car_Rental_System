<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/../../config/config.php';
    
    if (!isset($conn)) {
        throw new Exception('Database connection not established');
    }

    // Get total cars
    $carStmt = $conn->query("SELECT COUNT(*) as total FROM cars");
    $totalCars = $carStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get total customers
    $custStmt = $conn->query("SELECT COUNT(*) as total FROM customer");
    $totalCustomers = $custStmt->fetch(PDO::FETCH_ASSOC)['total'];

    $response = [
        'success' => true,
        'totalCars' => intval($totalCars),
        'totalCustomers' => intval($totalCustomers)
    ];
} catch (Exception $e) {
    $response = ['success' => false, 'message' => 'Database error'];
}

echo json_encode($response);
exit();
