<?php
session_start();
include_once 'conn.php';
header('Content-Type: application/json');

function sendResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Invalid request method');
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $requiredFields = ['car_id', 'employee_id', 'pickup_date', 'return_date'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            sendResponse(false, null, "Missing required field: $field");
        }
    }

    // Get customerID from session
    if (!isset($_SESSION['customer_id'])) {
        sendResponse(false, null, 'User not logged in');
    }
    $customerID = $_SESSION['customer_id'];
    
    // Begin transaction
    $conn->begin_transaction();

    // Check if car is available
    $checkCarQuery = "SELECT status FROM cars WHERE car_id = ? AND status = 'Available'";
    $stmt = $conn->prepare($checkCarQuery);
    $stmt->bind_param("i", $data['car_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $conn->rollback();
        sendResponse(false, null, 'Car is not available for reservation');
    }

    // Insert reservation
    $query = "INSERT INTO reservation (customerID, carID, employeeID, startDate, endDate) 
              VALUES (?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("iiiss", 
        $customerID,
        $data['car_id'],
        $data['employee_id'],
        $data['pickup_date'],
        $data['return_date']
    );
    
    if ($stmt->execute()) {
        $reservationId = $conn->insert_id;
        
        // Insert into transaction table
        $transactionQuery = "INSERT INTO transaction (reservationID, transactionDate, totalAmount, status) 
                            VALUES (?, CURDATE(), ?, 'Not paid')";
        $stmt = $conn->prepare($transactionQuery);
        $totalAmount = isset($data['total_amount']) ? $data['total_amount'] : 0.00;
        $stmt->bind_param("id", $reservationId, $totalAmount);
        
        if (!$stmt->execute()) {
            $conn->rollback();
            sendResponse(false, null, 'Failed to create transaction record');
            exit;
        }

        // Update car status
        $updateCarQuery = "UPDATE cars SET status = 'Unavailable' WHERE car_id = ?";
        $stmt = $conn->prepare($updateCarQuery);
        $stmt->bind_param("i", $data['car_id']);
        $stmt->execute();

        $conn->commit();
        sendResponse(true, [
            'reservation_id' => $reservationId,
            'customer_id' => $customerID
        ], 'Reservation created successfully');
    } else {
        $conn->rollback();
        sendResponse(false, null, 'Failed to create reservation');
    }

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    sendResponse(false, null, 'Error creating reservation: ' . $e->getMessage());
}

$conn->close();
?>
