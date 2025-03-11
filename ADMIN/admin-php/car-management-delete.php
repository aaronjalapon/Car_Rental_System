<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['car_id'])) {
        throw new Exception('Car ID is required');
    }
    
    $carId = intval($data['car_id']);

    // Start transaction
    $conn->begin_transaction();

    // Get model_id before deleting car
    $query = "SELECT model_id FROM cars WHERE car_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $carId);
    $stmt->execute();
    $result = $stmt->get_result();
    $car = $result->fetch_assoc();
    
    if (!$car) {
        throw new Exception('Car not found');
    }
    
    $modelId = $car['model_id'];

    // Delete from cars table first
    $query = "DELETE FROM cars WHERE car_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $carId);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to delete car: ' . $conn->error);
    }

    // Then delete from car_models
    $query = "DELETE FROM car_models WHERE model_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $modelId);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to delete car model: ' . $conn->error);
    }

    // Commit transaction
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Car deleted successfully'
    ]);

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
}
?>