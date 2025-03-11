<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id']) || !isset($data['name']) || !isset($data['email']) || !isset($data['phone'])) {
        throw new Exception('All fields are required');
    }
    
    $stmt = $conn->prepare("UPDATE `carrentalservices-1`.`customer` 
                           SET name = ?, email = ?, contact = ? 
                           WHERE id = ?");
    
    $stmt->bind_param("sssi", $data['name'], $data['email'], $data['phone'], $data['id']);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to update customer');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Customer updated successfully'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

if (isset($stmt)) {
    $stmt->close();
}
$conn->close();
?>
