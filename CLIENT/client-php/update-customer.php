<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['id'])) {
        throw new Exception('Customer ID is required');
    }

    $customerId = (int)$data['id'];
    $name = $conn->real_escape_string($data['name']);
    $email = $conn->real_escape_string($data['email']);
    $phone = $conn->real_escape_string($data['phone']);

    $query = "UPDATE carrentalservices.customer SET 
              name = ?, 
              email = ?, 
              contact = ?
              WHERE id = ?";
              
    $stmt = $conn->prepare($query);
    $stmt->bind_param("sssi", $name, $email, $phone, $customerId);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update customer");
    }

    echo json_encode([
        'success' => true,
        'message' => 'Customer updated successfully'
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
