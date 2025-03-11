<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['customerId']) || !isset($data['status'])) {
        throw new Exception('Customer ID and status are required');
    }
    
    $customerId = (int)$data['customerId'];
    $status = $data['status'] === 'verified' ? 1 : 0;
    
    $stmt = $conn->prepare("UPDATE `carrentalservices-1`.`customer` SET license_verified = ? WHERE id = ?");
    $stmt->bind_param("ii", $status, $customerId);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to update license status');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'License status updated successfully'
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
