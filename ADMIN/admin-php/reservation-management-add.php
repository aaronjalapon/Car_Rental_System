<?php
require_once 'conn.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // First update the car status to Unavailable
        $updateCarStatus = "UPDATE cars SET status = 'Unavailable' WHERE car_id = ?";
        $stmt = mysqli_prepare($conn, $updateCarStatus);
        mysqli_stmt_bind_param($stmt, "i", $data['carID']);
        
        if(!mysqli_stmt_execute($stmt)) {
            throw new Exception("Error updating car status: " . mysqli_error($conn));
        }
        
        // Then insert the reservation
        $query = "INSERT INTO reservation (customerID, carID, employeeID, startDate, endDate) 
                  VALUES (?, ?, ?, ?, ?)";
        
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, "iiiss", 
            $data['customerID'],
            $data['carID'],
            $data['employeeID'],
            $data['startDate'],
            $data['endDate']
        );
        
        if(mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => 'Reservation added successfully']);
        } else {
            // If reservation fails, revert car status
            $revertStatus = "UPDATE cars SET status = 'Available' WHERE car_id = ?";
            $stmt = mysqli_prepare($conn, $revertStatus);
            mysqli_stmt_bind_param($stmt, "i", $data['carID']);
            mysqli_stmt_execute($stmt);
            
            throw new Exception("Error creating reservation: " . mysqli_error($conn));
        }
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
