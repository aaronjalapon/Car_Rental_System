<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

try {
    require_once('conn.php');

    if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        throw new Exception('Invalid or missing car ID');
    }

    $carId = intval($_GET['id']);
    
    // Updated query to join all necessary tables
    $query = "SELECT c.*, 
              m.model_name,
              b.brand_name,
              bt.bodyType_name
              FROM cars c
              LEFT JOIN car_models m ON c.model_id = m.model_id
              LEFT JOIN car_brand b ON m.brand_id = b.brand_id
              LEFT JOIN car_bodytype bt ON m.bodyType_id = bt.bodyType_id
              WHERE c.car_id = ?";
    
    $stmt = mysqli_prepare($conn, $query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . mysqli_error($conn));
    }

    mysqli_stmt_bind_param($stmt, "i", $carId);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Execute failed: " . mysqli_stmt_error($stmt));
    }
    
    $result = mysqli_stmt_get_result($stmt);
    if (!$result) {
        throw new Exception("Getting result failed: " . mysqli_error($conn));
    }

    $car = mysqli_fetch_assoc($result);
    
    if (!$car) {
        throw new Exception("Car with ID $carId not found");
    }

    // Return all fetched data
    echo json_encode([
        'success' => true,
        'car' => [
            'car_id' => $car['car_id'],
            'model_id' => $car['model_id'],
            'plate_number' => $car['plate_number'],
            'year' => $car['year'],
            'daily_rate' => $car['daily_rate'],
            'status' => $car['status'] ?? 'Available',
            'brand' => $car['brand_name'],
            'model' => $car['model_name'],
            'bodyType' => $car['bodyType_name']
        ],
        'debug' => [
            'id_received' => $carId,
            'query' => $query
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'id_received' => $_GET['id'] ?? 'not set',
            'file' => basename(__FILE__),
            'line' => $e->getLine()
        ]
    ]);
} finally {
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    if (isset($conn)) {
        mysqli_close($conn);
    }
}
?>
