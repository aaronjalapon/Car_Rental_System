<?php
require_once 'conn.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Start transaction
        mysqli_begin_transaction($conn);
        
        // First, delete related transaction records
        $deleteTransactionQuery = "DELETE FROM transaction WHERE reservationID = ?";
        $stmt = mysqli_prepare($conn, $deleteTransactionQuery);
        mysqli_stmt_bind_param($stmt, "i", $data['id']);
        mysqli_stmt_execute($stmt);
        
        // Get the car ID from the reservation
        $getCarQuery = "SELECT carID FROM reservation WHERE id = ?";
        $stmt = mysqli_prepare($conn, $getCarQuery);
        mysqli_stmt_bind_param($stmt, "i", $data['id']);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $carData = mysqli_fetch_assoc($result);
        
        if ($carData) {
            // Update car status back to Available
            $updateCarStatus = "UPDATE cars SET status = 'Available' WHERE car_id = ?";
            $stmt = mysqli_prepare($conn, $updateCarStatus);
            mysqli_stmt_bind_param($stmt, "i", $carData['carID']);
            mysqli_stmt_execute($stmt);
        }
        
        // Finally, delete the reservation
        $deleteReservationQuery = "DELETE FROM reservation WHERE id = ?";
        $stmt = mysqli_prepare($conn, $deleteReservationQuery);
        mysqli_stmt_bind_param($stmt, "i", $data['id']);
        
        if(mysqli_stmt_execute($stmt)) {
            mysqli_commit($conn);
            echo json_encode(['success' => true, 'message' => 'Reservation deleted successfully']);
        } else {
            throw new Exception("Error deleting reservation: " . mysqli_error($conn));
        }
    } catch(Exception $e) {
        mysqli_rollback($conn);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
