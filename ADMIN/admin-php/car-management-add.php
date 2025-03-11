<?php
require_once 'conn.php';
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Log received data for debugging
    $rawData = file_get_contents('php://input');
    error_log("Received raw data: " . substr($rawData, 0, 100) . "...");
    
    $data = json_decode($rawData, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("JSON decode error: " . json_last_error_msg());
    }

    if (empty($data['image'])) {
        throw new Exception("No image data received");
    }

    // Get image data
    $imageData = base64_decode($data['image']);
    if ($imageData === false) {
        throw new Exception("Invalid base64 data");
    }

    // Create target directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../IMAGES/present-cars/';
    if (!file_exists($uploadDir) && !mkdir($uploadDir, 0777, true)) {
        throw new Exception("Failed to create upload directory");
    }

    // Generate unique filename and save file directly
    $uniqueFileName = uniqid() . '.png';
    $targetPath = $uploadDir . $uniqueFileName;

    // Save file directly
    if (file_put_contents($targetPath, $imageData) === false) {
        throw new Exception("Failed to save image file");
    }

    // Verify file was saved
    if (!file_exists($targetPath) || filesize($targetPath) === 0) {
        throw new Exception("File was not saved correctly");
    }

    // Database path
    $dbImagePath = 'IMAGES/present-cars/' . $uniqueFileName;

    // Database operations
    $conn->begin_transaction();

    try {
        // Insert brand if not exists
        $stmt = $conn->prepare("INSERT IGNORE INTO car_brand (brand_name) VALUES (?)");
        $stmt->bind_param("s", $data['brand']);
        $stmt->execute();
        $brand_id = $stmt->insert_id ?: $conn->query("SELECT brand_id FROM car_brand WHERE brand_name = '{$data['brand']}'")->fetch_object()->brand_id;
        
        // Insert body type if not exists
        $stmt = $conn->prepare("INSERT IGNORE INTO car_bodytype (bodyType_name) VALUES (?)");
        $stmt->bind_param("s", $data['bodyType']);
        $stmt->execute();
        $bodyType_id = $stmt->insert_id ?: $conn->query("SELECT bodyType_id FROM car_bodytype WHERE bodyType_name = '{$data['bodyType']}'")->fetch_object()->bodyType_id;
        
        // Insert car model
        $stmt = $conn->prepare("INSERT INTO car_models (brand_id, model_name, bodyType_id, image) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isis", $brand_id, $data['model'], $bodyType_id, $dbImagePath);
        $stmt->execute();
        $model_id = $stmt->insert_id;
        
        // Insert car
        $stmt = $conn->prepare("INSERT INTO cars (model_id, plate_number, year, daily_rate, status) VALUES (?, ?, ?, ?, 'Available')");
        $stmt->bind_param("issd", $model_id, $data['plate_number'], $data['year'], $data['daily_rate']);
        $stmt->execute();
        
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Car added successfully',
            'data' => [
                'image_path' => $dbImagePath,
                'model_id' => $model_id
            ]
        ]);
        exit;

    } catch (Exception $e) {
        $conn->rollback();
        if (file_exists($targetPath)) {
            unlink($targetPath);
        }
        throw $e;
    }

} catch (Exception $e) {
    error_log("Error in car-management-add.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]
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