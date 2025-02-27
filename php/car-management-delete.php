<?php
require_once 'conn.php';
header('Content-Type: application/json');

if (!$conn) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $carId = isset($data['car_id']) ? (int)$data['car_id'] : 0;

    if (empty($carId)) {
        throw new Exception('Car ID is required');
    }

    // Check if car has active rentals
    $query = "DELETE FROM carrentalservices.cars WHERE car_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $carId);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to delete car: ' . $conn->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception('Car not found');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Car deleted successfully'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

if (isset($stmt)) {
    $stmt->close();
}
$conn->close();
?>