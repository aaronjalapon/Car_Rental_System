<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    if (!isset($_GET['brand_id'])) {
        throw new Exception('Brand ID is required');
    }

    $brand_id = intval($_GET['brand_id']);
    
    // Updated query to prevent duplicates
    $query = "SELECT DISTINCT 
                m.model_id,
                m.model_name,
                m.bodyType_id,
                bt.bodyType_name 
              FROM (
                SELECT DISTINCT model_id, model_name, bodyType_id, brand_id
                FROM car_models
                WHERE brand_id = ?
              ) m
              LEFT JOIN car_bodytype bt ON m.bodyType_id = bt.bodyType_id
              ORDER BY m.model_name ASC";
              
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $brand_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to fetch models: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $models = [];
    $seen = []; // Track seen models to prevent duplicates
    
    while ($row = $result->fetch_assoc()) {
        $modelKey = $row['model_id'] . '-' . $row['model_name'];
        if (!isset($seen[$modelKey])) {
            $models[] = [
                'model_id' => $row['model_id'],
                'model_name' => $row['model_name'],
                'bodyType_id' => $row['bodyType_id'],
                'bodyType_name' => $row['bodyType_name']
            ];
            $seen[$modelKey] = true;
        }
    }
    
    echo json_encode([
        'success' => true,
        'models' => $models,
        'debug' => [
            'query' => $query,
            'brand_id' => $brand_id,
            'model_count' => count($models)
        ]
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
