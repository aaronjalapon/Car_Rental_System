<?php
include_once 'conn.php';
require_once 'conn.php';
header('Content-Type: application/json');

if (!isset($_GET['id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Customer ID is required'
    ]);
    exit;
}

$customerId = (int)$_GET['id'];

try {
    $query = "SELECT id, name, email, contact, address, license, lastRental 
              FROM customer 
              WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $customerId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($customer = $result->fetch_assoc()) {
        echo json_encode([
            'success' => true,
            'customer' => $customer
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Customer not found'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while fetching customer details.'
    ]);
    error_log("Error in customer view: " . $e->getMessage());
}

if (isset($stmt)) {
    $stmt->close();
}
$conn->close();
?>