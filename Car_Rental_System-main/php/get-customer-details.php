<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    if (!isset($_GET['id'])) {
        throw new Exception('Customer ID is required');
    }

    $customerId = (int)$_GET['id'];
    
    $query = "SELECT id, name, email, contact, dlpic, 
              CASE 
                WHEN license_verified = 1 THEN 'verified'
                WHEN license_verified = 0 THEN 'invalid'
                ELSE 'pending'
              END as license_status,
              lastRental 
              FROM carrentalservices.customer 
              WHERE id = ?";
              
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $customerId);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    if (!$result) {
        throw new Exception("Get result failed: " . $stmt->error);
    }

    $customer = $result->fetch_assoc();
    if (!$customer) {
        throw new Exception("Customer not found");
    }

    // Convert image data to base64 if it exists
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
    error_log("Error in get customer details: " . $e->getMessage());
}

if (isset($stmt)) {
    $stmt->close();
}
if (isset($conn)) {
    $conn->close();
}
?>