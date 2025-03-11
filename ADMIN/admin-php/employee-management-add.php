<?php
header('Content-Type: application/json');
require_once '../../MAIN/main-php/conn.php';

try {
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Get and sanitize form data
    $name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
    $position = filter_input(INPUT_POST, 'position', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $phone = filter_input(INPUT_POST, 'phone', FILTER_SANITIZE_STRING);
    $password = $_POST['password'] ?? '';
    $status = filter_input(INPUT_POST, 'status', FILTER_SANITIZE_STRING);

    // Validate required fields
    if (!$name || !$position || !$email || !$phone || !$password || !$status) {
        throw new Exception('All fields are required');
    }

    // Validate position enum values
    $validPositions = ['CRSS manager', 'Transporter', 'Agent'];
    if (!in_array($position, $validPositions)) {
        throw new Exception('Invalid position selected');
    }

    // Validate status enum values
    $validStatuses = ['Active', 'Inactive', 'On leave'];
    if (!in_array($status, $validStatuses)) {
        throw new Exception('Invalid status selected');
    }

    // Check for duplicate email
    $stmt = $conn->prepare("SELECT id FROM employee WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        throw new Exception('Email already exists');
    }

    // Insert new employee
    $stmt = $conn->prepare("INSERT INTO employee (name, position, email, phone, password, status) VALUES (?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception("Database error: " . $conn->error);
    }

    $stmt->bind_param("ssssss", $name, $position, $email, $phone, $password, $status);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to add employee: " . $stmt->error);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Employee added successfully',
        'employeeId' => $conn->insert_id
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();