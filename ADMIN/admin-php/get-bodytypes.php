<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    if (!isset($_GET['model_id'])) {
        throw new Exception('Model ID is required');
    }

    $model_id = intval($_GET['model_id']);
    
    $query = "SELECT bt.bodyType_id, bt.bodyType_name 
              FROM car_bodytype bt 
              INNER JOIN car_models m ON m.bodyType_id = bt.bodyType_id 
              WHERE m.model_id = ?";
              
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $model_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to fetch body types: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $bodyTypes = [];
    
    while ($row = $result->fetch_assoc()) {
        $bodyTypes[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'bodyTypes' => $bodyTypes
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>
