<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    $query = "SELECT c.car_id, c.plate_number, c.year, c.daily_rate, c.status,
              cb.brand_name, cm.model_name, cbt.bodyType_name, cm.image
              FROM carrentalservices.cars c
              JOIN carrentalservices.car_models cm ON c.model_id = cm.model_id
              JOIN carrentalservices.car_brand cb ON cm.brand_id = cb.brand_id
              JOIN carrentalservices.car_bodyType cbt ON cm.bodyType_id = cbt.bodyType_id
              ORDER BY c.car_id";

    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $cars = [];
    while ($row = $result->fetch_assoc()) {
        $cars[] = [
            'car_id' => $row['car_id'],
            'plate_number' => $row['plate_number'],
            'brand' => $row['brand_name'],
            'model' => $row['model_name'],
            'bodyType' => $row['bodyType_name'],
            'year' => $row['year'],
            'daily_rate' => $row['daily_rate'],
            'status' => $row['status'],
            'image' => base64_encode($row['image'])
        ];
    }

    echo json_encode([
        'success' => true,
        'cars' => $cars
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>
