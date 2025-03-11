<?php
require_once 'conn.php';
header('Content-Type: application/json');

try {
    $query = "SELECT t.*, r.customerID, c.name as customerName 
              FROM transaction t 
              JOIN reservation r ON t.reservationID = r.id 
              JOIN customer c ON r.customerID = c.id 
              ORDER BY t.transactionDate DESC";
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $transactions = [];
    while ($row = $result->fetch_assoc()) {
        $transactions[] = [
            'id' => $row['id'],
            'reservationID' => $row['reservationID'],
            'customerName' => $row['customerName'],
            'transactionDate' => $row['transactionDate'],
            'totalAmount' => $row['totalAmount'],
            'status' => $row['status']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $transactions
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
