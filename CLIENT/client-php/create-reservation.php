<?php
// session_start();
include_once 'conn.php';

header('Content-Type: application/json');

// Check if user is logged in
// if (!isset($_SESSION['user_id'])) {
//     echo json_encode([
//         'success' => false,
//         'message' => 'Please log in to make a reservation'
//     ]);
//     exit;
// }

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

try {
    // Validate required fields
    $required_fields = ['car_id', 'employee_id', 'pickup_date', 'return_date'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    // Start transaction
    $conn->begin_transaction();

    // Check if car is still available
    $stmt = $conn->prepare("
        SELECT status 
        FROM cars 
        WHERE car_id = ? 
        AND status = 'Available' 
        FOR UPDATE
    ");
    $stmt->bind_param("i", $data['car_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Car is no longer available");
    }

    // Create reservation
    $stmt = $conn->prepare("
        INSERT INTO reservation (
            customerID,
            carID,
            employeeID,
            startDate,
            endDate
        ) VALUES (?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "iiiss",
        $_SESSION['user_id'],
        $data['car_id'],
        $data['employee_id'],
        $data['pickup_date'],
        $data['return_date']
    );

    if (!$stmt->execute()) {
        throw new Exception("Failed to create reservation");
    }

    $reservation_id = $conn->insert_id;

    // Update car status to Reserved
    $stmt = $conn->prepare("
        UPDATE cars 
        SET status = 'Reserved' 
        WHERE car_id = ?
    ");
    
    $stmt->bind_param("i", $data['car_id']);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update car status");
    }

    // Commit transaction
    $conn->commit();

    // Send success response
    echo json_encode([
        'success' => true,
        'data' => [
            'reservation_id' => $reservation_id,
            'message' => 'Your reservation has been created successfully'
        ]
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if ($conn->connect_errno) {
        $conn->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
