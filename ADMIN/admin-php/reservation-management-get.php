<?php
require_once 'conn.php';

if(isset($_GET['id'])) {
    try {
        $query = "SELECT r.*, 
                  c.name AS customerName,
                  ca.car_id,
                  CONCAT(cb.brand_name, ' ', cm.model_name) AS carModel,
                  e.name AS employeeName,
                  t.status AS paymentStatus,
                  t.totalAmount,
                  t.id AS transactionId
                  FROM reservation r
                  JOIN customer c ON r.customerID = c.id
                  JOIN cars ca ON r.carID = ca.car_id
                  JOIN car_models cm ON ca.model_id = cm.model_id
                  JOIN car_brand cb ON cm.brand_id = cb.brand_id
                  JOIN employee e ON r.employeeID = e.id
                  LEFT JOIN transaction t ON r.id = t.reservationID
                  WHERE r.id = ?";
        
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, "i", $_GET['id']);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        
        if($row = mysqli_fetch_assoc($result)) {
            echo json_encode([
                'success' => true,
                'reservation' => [
                    'id' => $row['id'],
                    'customerName' => $row['customerName'],
                    'carModel' => $row['carModel'],
                    'employeeName' => $row['employeeName'],
                    'startDate' => $row['startDate'],
                    'endDate' => $row['endDate'],
                    'status' => $row['status'] ?? 'ongoing',
                    'paymentStatus' => $row['paymentStatus'] ?? 'Not paid',
                    'totalAmount' => $row['totalAmount'] ?? '0.00'
                ]
            ]);
        } else {
            throw new Exception("Reservation not found");
        }
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No reservation ID provided']);
}
?>
