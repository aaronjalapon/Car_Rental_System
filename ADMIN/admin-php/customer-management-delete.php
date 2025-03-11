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
    $data = json_decode(file_get_contents('php://input'), true);
    $customerId = isset($data['customerId']) ? (int)$data['customerId'] : 0;

    if (empty($customerId)) {
        throw new Exception('Customer ID is required');
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // 1. First, get all reservation IDs for this customer
        $getReservationsQuery = "SELECT id FROM `carrentalservices-1`.`reservation` WHERE customerID = ?";
        $reservationStmt = $conn->prepare($getReservationsQuery);
        $reservationStmt->bind_param("i", $customerId);
        $reservationStmt->execute();
        $reservationResult = $reservationStmt->get_result();
        
        // 2. Delete transactions for each reservation
        while ($row = $reservationResult->fetch_assoc()) {
            $deleteTransactionsQuery = "DELETE FROM `carrentalservices-1`.`transaction` WHERE reservationID = ?";
            $transactionStmt = $conn->prepare($deleteTransactionsQuery);
            $transactionStmt->bind_param("i", $row['id']);
            
            if (!$transactionStmt->execute()) {
                throw new Exception('Failed to delete transactions: ' . $conn->error);
            }
        }

        // 3. Now delete all reservations
        $deleteReservationsQuery = "DELETE FROM `carrentalservices-1`.`reservation` WHERE customerID = ?";
        $deleteReservationStmt = $conn->prepare($deleteReservationsQuery);
        $deleteReservationStmt->bind_param("i", $customerId);
        
        if (!$deleteReservationStmt->execute()) {
            throw new Exception('Failed to delete reservations: ' . $conn->error);
        }

        // 4. Finally, delete the customer
        $deleteCustomerQuery = "DELETE FROM `carrentalservices-1`.`customer` WHERE id = ?";
        $customerStmt = $conn->prepare($deleteCustomerQuery);
        $customerStmt->bind_param("i", $customerId);
        
        if (!$customerStmt->execute()) {
            throw new Exception('Failed to delete customer: ' . $conn->error);
        }

        if ($customerStmt->affected_rows === 0) {
            throw new Exception('Customer not found');
        }

        // If everything is successful, commit the transaction
        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Customer and all related records deleted successfully'
        ]);

    } catch (Exception $e) {
        // If there's an error, rollback the transaction
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    error_log("Error in customer delete: " . $e->getMessage());
}

// Close all statements
if (isset($transactionStmt)) {
    $transactionStmt->close();
}
if (isset($reservationStmt)) {
    $reservationStmt->close();
}
if (isset($deleteReservationStmt)) {
    $deleteReservationStmt->close();
}
if (isset($customerStmt)) {
    $customerStmt->close();
}
$conn->close();
?>