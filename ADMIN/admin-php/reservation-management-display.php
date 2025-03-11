<?php
require_once 'conn.php';

header('Content-Type: application/json');

try {
    $query = "SELECT r.*, 
              c.name AS customerName, 
              CONCAT(cb.brand_name, ' ', cm.model_name) AS carModel,
              e.name AS employeeName,
              t.status AS paymentStatus,
              t.totalAmount
              FROM reservation r
              JOIN customer c ON r.customerID = c.id
              JOIN cars ca ON r.carID = ca.car_id
              JOIN car_models cm ON ca.model_id = cm.model_id
              JOIN car_brand cb ON cm.brand_id = cb.brand_id
              JOIN employee e ON r.employeeID = e.id
              LEFT JOIN transaction t ON r.id = t.reservationID
              ORDER BY r.id DESC";
    
    if (!$result = mysqli_query($conn, $query)) {
        throw new Exception(mysqli_error($conn));
    }
    
    $response = array();
    if (mysqli_num_rows($result) > 0) {
        while($row = mysqli_fetch_assoc($result)) {
            $response[] = array(
                "id" => $row['id'],
                "customerName" => htmlspecialchars($row['customerName']),
                "carModel" => htmlspecialchars($row['carModel']),
                "employeeName" => htmlspecialchars($row['employeeName']),
                "startDate" => $row['startDate'],
                "endDate" => $row['endDate'],
                "status" => $row['status'],
                "paymentStatus" => $row['paymentStatus'] ?? 'Not paid',
                "totalAmount" => $row['totalAmount'] ?? '0.00'
            );
        }
    }
    echo json_encode($response);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => $e->getMessage()));
}
?>
