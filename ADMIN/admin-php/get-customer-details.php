<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    if (!isset($_GET['id'])) {
        throw new Exception('Customer ID is required');
    }

    $customerId = (int)$_GET['id'];
    
    $stmt = $conn->prepare("SELECT id, name, email, contact, dlpic, lastRental, 
                           CASE 
                             WHEN license_verified = 1 THEN 'verified'
                             WHEN license_verified = 0 THEN 'invalid'
                             ELSE 'pending'
                           END as license_status
                           FROM `carrentalservices-1`.`customer` WHERE id = ?");
    
    $stmt->bind_param("i", $customerId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Customer not found');
    }
    
    $customer = $result->fetch_assoc();
    
    // Convert dlpic blob to base64 if it exists
    if ($customer['dlpic']) {
        $customer['dlpic'] = base64_encode($customer['dlpic']);
    }
    
    echo json_encode([
        'success' => true,
        'customer' => $customer
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$stmt->close();
$conn->close();
?>
