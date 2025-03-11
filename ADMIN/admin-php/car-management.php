<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

try {
    require_once('conn.php');

    // Updated query to prevent duplicates
    $query = "SELECT DISTINCT 
                c.car_id,
                c.model_id,
                c.plate_number,
                c.year,
                c.daily_rate,
                c.status,
                m.model_name,
                m.image,
                b.brand_name,
                bt.bodyType_name
              FROM (
                SELECT DISTINCT *
                FROM cars
              ) c
              LEFT JOIN car_models m ON c.model_id = m.model_id
              LEFT JOIN car_brand b ON m.brand_id = b.brand_id
              LEFT JOIN car_bodytype bt ON m.bodyType_id = bt.bodyType_id
              GROUP BY c.car_id
              ORDER BY c.car_id DESC";
    
    if (!($result = mysqli_query($conn, $query))) {
        throw new Exception("Query failed: " . mysqli_error($conn));
    }

    $cars = [];
    $seen = []; // Track seen cars

    while ($row = mysqli_fetch_assoc($result)) {
        $carKey = $row['car_id'];
        
        // Only add if we haven't seen this car before
        if (!isset($seen[$carKey])) {
            // Convert image BLOB to base64 if it exists
            $imageData = null;
            if (isset($row['image']) && $row['image']) {
                $imageData = base64_encode($row['image']);
            }

            $cars[] = [
                'car_id' => $row['car_id'],
                'model_id' => $row['model_id'],
                'plate_number' => $row['plate_number'],
                'year' => $row['year'],
                'daily_rate' => $row['daily_rate'],
                'status' => $row['status'] ?? 'Available',
                'brand' => $row['brand_name'] ?? 'Unknown Brand',
                'model' => $row['model_name'] ?? 'Unknown Model',
                'bodyType' => $row['bodyType_name'] ?? 'Unknown Type',
                'image' => $imageData
            ];
            
            $seen[$carKey] = true;
        }
    }

    echo json_encode([
        'success' => true,
        'cars' => $cars,
        'debug' => [
            'query' => $query,
            'count' => count($cars),
            'unique_count' => count($seen)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'file' => basename(__FILE__),
            'line' => $e->getLine()
        ]
    ]);
} finally {
    if (isset($conn)) {
        mysqli_close($conn);
    }
}
?>
