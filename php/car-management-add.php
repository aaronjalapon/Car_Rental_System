<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

try {
    require_once 'conn.php';

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Get JSON input and decode it
    $jsonInput = file_get_contents('php://input');
    if (!$jsonInput) {
        throw new Exception('No data received');
    }

    $data = json_decode($jsonInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data: ' . json_last_error_msg());
    }

    // Validate required fields
    $requiredFields = ['brand', 'model', 'bodyType', 'plate_number', 'year', 'daily_rate', 'image'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            throw new Exception("Missing required field: {$field}");
        }
    }

    // Start transaction
    $conn->begin_transaction();

    // First, check if brand exists, if not insert it
    $brandQuery = "SELECT brand_id FROM carrentalservices.car_brand WHERE brand_name = ?";
    $stmt = $conn->prepare($brandQuery);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param("s", $data['brand']);
    $stmt->execute();
    $brandResult = $stmt->get_result();
    
    if ($brandResult->num_rows === 0) {
        // Insert new brand if it doesn't exist
        $insertBrandQuery = "INSERT INTO carrentalservices.car_brand (brand_name) VALUES (?)";
        $stmt = $conn->prepare($insertBrandQuery);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        $stmt->bind_param("s", $data['brand']);
        if (!$stmt->execute()) {
            throw new Exception("Invalid brand name. Must be one of: Mitsubishi, Toyota, Nissan");
        }
        $brandId = $conn->insert_id;
    } else {
        $brandId = $brandResult->fetch_assoc()['brand_id'];
    }

    // Similarly for bodyType
    $bodyTypeQuery = "SELECT bodyType_id FROM carrentalservices.car_bodyType WHERE bodyType_name = ?";
    $stmt = $conn->prepare($bodyTypeQuery);
    $stmt->bind_param("s", $data['bodyType']);
    $stmt->execute();
    $bodyTypeResult = $stmt->get_result();
    
    if ($bodyTypeResult->num_rows === 0) {
        // Insert new bodyType if it doesn't exist
        $insertBodyTypeQuery = "INSERT INTO carrentalservices.car_bodyType (bodyType_name) VALUES (?)";
        $stmt = $conn->prepare($insertBodyTypeQuery);
        if (!$stmt->execute()) {
            throw new Exception("Invalid body type. Must be one of: Sedan, Van, SUV, Hatchback");
        }
        $bodyTypeId = $conn->insert_id;
    } else {
        $bodyTypeId = $bodyTypeResult->fetch_assoc()['bodyType_id'];
    }

    // Insert into car_models
    $modelQuery = "INSERT INTO carrentalservices.car_models (brand_id, model_name, bodyType_id, image) VALUES (?, ?, ?, FROM_BASE64(?))";
    $stmt = $conn->prepare($modelQuery);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param("isis", $brandId, $data['model'], $bodyTypeId, $data['image']);
    if (!$stmt->execute()) {
        throw new Exception("Error inserting model: " . $stmt->error);
    }
    $modelId = $conn->insert_id;

    // Insert into cars
    $carQuery = "INSERT INTO carrentalservices.cars (model_id, plate_number, year, daily_rate, status) VALUES (?, ?, ?, ?, 'Available')";
    $stmt = $conn->prepare($carQuery);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param("isid", $modelId, $data['plate_number'], $data['year'], $data['daily_rate']);
    if (!$stmt->execute()) {
        throw new Exception("Error inserting car: " . $stmt->error);
    }

    // Commit transaction
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Car added successfully'
    ]);

} catch (Exception $e) {
    // Rollback transaction if active
    if (isset($conn) && $conn->connect_errno === 0) {
        $conn->rollback();
    }

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>