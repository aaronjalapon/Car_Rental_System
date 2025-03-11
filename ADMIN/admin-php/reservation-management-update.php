<?php
require_once 'conn.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "UPDATE reservation 
                  SET customerID = ?, 
                      carID = ?, 
                      employeeID = ?, 
                      startDate = ?, 
                      endDate = ?
                  WHERE id = ?";
        
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, "iiissi", 
            $data['customerID'],
            $data['carID'],
            $data['employeeID'],
            $data['startDate'],
            $data['endDate'],
            $data['id']
        );
        
        if(mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => 'Reservation updated successfully']);
        } else {
            throw new Exception("Error executing statement: " . mysqli_stmt_error($stmt));
        }
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
