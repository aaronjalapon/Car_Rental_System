<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['customerId']) || !isset($data['status'])) {
        throw new Exception('Missing required data');
    }

    $customerId = (int)$data['customerId'];
    $status = $data['status'] === 'verified' ? 1 : 0;

    $query = "UPDATE carrentalservices.customer SET license_verified = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("ii", $status, $customerId);
    
    if (!$stmt->execute()) {
        throw new Exception("Update failed: " . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception("No customer found with ID: $customerId");
    }

    echo json_encode([
        'success' => true,
        'message' => 'License status updated successfully'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

if (isset($stmt)) {
    $stmt->close();
}
if (isset($conn)) {
    $conn->close();
}
?>
