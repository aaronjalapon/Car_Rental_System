<?php
include_once 'conn.php';
require_once 'conn.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $customerId = isset($data['customerId']) ? (int)$data['customerId'] : 0;

    if (empty($customerId)) {
        throw new Exception('Customer ID is required');
    }

    // Directly proceed with deletion since we don't have a separate rentals table
    $deleteQuery = "DELETE FROM carrentalservices.customer WHERE id = ?";
    $deleteStmt = $conn->prepare($deleteQuery);
    $deleteStmt->bind_param("i", $customerId);
    
    if (!$deleteStmt->execute()) {
        throw new Exception('Failed to delete customer: ' . $conn->error);
    }

    if ($deleteStmt->affected_rows === 0) {
        throw new Exception('Customer not found');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Customer deleted successfully'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    error_log("Error in customer delete: " . $e->getMessage());
}

if (isset($deleteStmt)) {
    $deleteStmt->close();
}
$conn->close();
?>