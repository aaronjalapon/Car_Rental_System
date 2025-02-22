<?php
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
    $customerId = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $license = $_POST['license'] ?? '';
    $address = $_POST['address'] ?? '';

    // Validate required fields
    if (empty($customerId) || empty($name) || empty($email) || empty($phone)) {
        throw new Exception('Required fields are missing');
    }

    $query = "UPDATE customer 
              SET name = ?, email = ?, contact = ?, license = ?, address = ? 
              WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("sssssi", $name, $email, $phone, $license, $address, $customerId);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Customer updated successfully'
        ]);
    } else {
        throw new Exception('Failed to update customer');
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    error_log("Error in customer edit: " . $e->getMessage());
}

if (isset($stmt)) {
    $stmt->close();
}
$conn->close();
?>