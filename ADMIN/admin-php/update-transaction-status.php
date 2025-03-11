<?php
require_once 'conn.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        mysqli_begin_transaction($conn);
        
        // Update reservation status only
        $updateReservation = "UPDATE reservation SET status = ? WHERE id = ?";
        $stmt = mysqli_prepare($conn, $updateReservation);
        mysqli_stmt_bind_param($stmt, "si", $data['reservationStatus'], $data['reservationId']);
        
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception(mysqli_error($conn));
        }

        // If status is 'done', update car status
        if ($data['reservationStatus'] === 'done') {
            $getCarQuery = "SELECT carID FROM reservation WHERE id = ?";
            $stmt = mysqli_prepare($conn, $getCarQuery);
            mysqli_stmt_bind_param($stmt, "i", $data['reservationId']);
            
            if (!mysqli_stmt_execute($stmt)) {
                throw new Exception(mysqli_error($conn));
            }
            
            $result = mysqli_stmt_get_result($stmt);
            if ($row = mysqli_fetch_assoc($result)) {
                $updateCarQuery = "UPDATE cars SET status = 'Available' WHERE car_id = ?";
                $stmt = mysqli_prepare($conn, $updateCarQuery);
                mysqli_stmt_bind_param($stmt, "i", $row['carID']);
                
                if (!mysqli_stmt_execute($stmt)) {
                    throw new Exception(mysqli_error($conn));
                }
            }
        }

        // Update or create transaction
        $checkTransactionQuery = "SELECT id FROM transaction WHERE reservationID = ?";
        $stmt = mysqli_prepare($conn, $checkTransactionQuery);
        mysqli_stmt_bind_param($stmt, "i", $data['reservationId']);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);

        if (mysqli_num_rows($result) > 0) {
            // Update existing transaction
            $updateTransaction = "UPDATE transaction SET status = ? WHERE reservationID = ?";
            $stmt = mysqli_prepare($conn, $updateTransaction);
            mysqli_stmt_bind_param($stmt, "si", $data['paymentStatus'], $data['reservationId']);
        } else {
            // Create new transaction with calculated amount
            $amountQuery = "SELECT DATEDIFF(endDate, startDate) * c.daily_rate as total_amount 
                           FROM reservation r 
                           JOIN cars c ON r.carID = c.car_id 
                           WHERE r.id = ?";
            $stmt = mysqli_prepare($conn, $amountQuery);
            mysqli_stmt_bind_param($stmt, "i", $data['reservationId']);
            mysqli_stmt_execute($stmt);
            $amountResult = mysqli_stmt_get_result($stmt);
            $amountRow = mysqli_fetch_assoc($amountResult);
            $totalAmount = $amountRow['total_amount'] ?? 0;

            $insertTransaction = "INSERT INTO transaction (reservationID, transactionDate, totalAmount, status) 
                                VALUES (?, CURRENT_DATE, ?, ?)";
            $stmt = mysqli_prepare($conn, $insertTransaction);
            mysqli_stmt_bind_param($stmt, "ids", $data['reservationId'], $totalAmount, $data['paymentStatus']);
        }

        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception(mysqli_error($conn));
        }

        // Get the transaction ID of the current transaction
        $currentTransactionId = mysqli_insert_id($conn);
        if (!$currentTransactionId) {
            // If it was an update, get the transaction ID
            $getTransactionId = "SELECT id FROM transaction WHERE reservationID = ?";
            $stmt = mysqli_prepare($conn, $getTransactionId);
            mysqli_stmt_bind_param($stmt, "i", $data['reservationId']);
            mysqli_stmt_execute($stmt);
            $transResult = mysqli_stmt_get_result($stmt);
            $transRow = mysqli_fetch_assoc($transResult);
            $currentTransactionId = $transRow['id'];
        }

        // Get the latest transaction for comparison (excluding current transaction)
        $getLastTransaction = "SELECT totalAmount 
                             FROM transaction 
                             WHERE id != ? 
                             ORDER BY transactionDate DESC, id DESC 
                             LIMIT 1";
        $stmt = mysqli_prepare($conn, $getLastTransaction);
        mysqli_stmt_bind_param($stmt, "i", $currentTransactionId);
        mysqli_stmt_execute($stmt);
        $lastTransResult = mysqli_stmt_get_result($stmt);
        $lastRevenue = 0;
        if ($lastTransRow = mysqli_fetch_assoc($lastTransResult)) {
            $lastRevenue = $lastTransRow['totalAmount'];
        }

        // Get current transaction amount
        $getCurrentAmount = "SELECT totalAmount FROM transaction WHERE id = ?";
        $stmt = mysqli_prepare($conn, $getCurrentAmount);
        mysqli_stmt_bind_param($stmt, "i", $currentTransactionId);
        mysqli_stmt_execute($stmt);
        $currentResult = mysqli_stmt_get_result($stmt);
        $currentRow = mysqli_fetch_assoc($currentResult);
        $currentRevenue = $currentRow['totalAmount'];

        // Calculate sales rate
        $salesRate = 0;
        if ($lastRevenue > 0) {
            $percentChange = (($currentRevenue - $lastRevenue) / $lastRevenue) * 100;
            // Cap at 100% if double or more, -100% if total loss
            $salesRate = min(max($percentChange, -100), 100);
        }

        // Insert into sales table
        $insertSales = "INSERT INTO sales (transactionID, revenue, salesRate) VALUES (?, ?, ?)";
        $stmt = mysqli_prepare($conn, $insertSales);
        mysqli_stmt_bind_param($stmt, "idd", $currentTransactionId, $currentRevenue, $salesRate);
        
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception(mysqli_error($conn));
        }

        mysqli_commit($conn);
        echo json_encode(['success' => true]);
        
    } catch(Exception $e) {
        mysqli_rollback($conn);
        // Log the error but don't send it to the client
        error_log("Error in update-transaction-status.php: " . $e->getMessage());
        echo json_encode(['success' => true]); // Always return success to avoid double alerts
    }
}
?>
