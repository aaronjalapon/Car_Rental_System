<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/../../config/config.php';
    
    if (!isset($conn)) {
        throw new Exception('Database connection not established');
    }
    
    $stmt = $conn->prepare("SELECT salesRate FROM sales ORDER BY id DESC LIMIT 1");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result && isset($result['salesRate'])) {
        $response = ['success' => true, 'salesRate' => floatval($result['salesRate'])];
    } else {
        $response = ['success' => false, 'message' => 'No data found'];
    }
} catch (PDOException $e) {
    $response = ['success' => false, 'message' => 'Database error'];
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Configuration error']);
    exit();
}

echo json_encode($response);
exit();
?>
