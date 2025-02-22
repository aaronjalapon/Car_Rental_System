
<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['car_id'])) {
        throw new Exception('Car ID is required');
    }

    // Update cars table
    $query = "UPDATE carrentalservices.cars 
              SET plate_number = ?, 
                  year = ?,
                  daily_rate = ?,
                  status = ?
              WHERE car_id = ?";
              
    $stmt = $conn->prepare($query);
    $stmt->bind_param("sidsi", 
        $data['plate_number'],
        $data['year'],
        $data['daily_rate'],
        $data['status'],
        $data['car_id']
    );
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update car");
    }

    echo json_encode([
        'success' => true,
        'message' => 'Car updated successfully'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$stmt->close();
$conn->close();
?>