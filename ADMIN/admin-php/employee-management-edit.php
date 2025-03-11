<?php
header('Content-Type: application/json');
require_once '../../MAIN/main-php/conn.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Get and validate form data
    $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
    $name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
    $position = filter_input(INPUT_POST, 'position', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $phone = filter_input(INPUT_POST, 'phone', FILTER_SANITIZE_STRING);
    $status = filter_input(INPUT_POST, 'status', FILTER_SANITIZE_STRING);
    $password = isset($_POST['password']) ? $_POST['password'] : null;

    // Debug log
    error_log("Received data - ID: $id, Name: $name, Position: $position, Email: $email, Phone: $phone, Status: $status");

    // Validate required fields
    if (!$id || !$name || !$position || !$email || !$phone || !$status) {
        throw new Exception('Missing required fields');
    }

    // Validate position values
    $validPositions = ['CRSS manager', 'Transporter', 'Agent'];
    if (!in_array($position, $validPositions)) {
        throw new Exception('Invalid position');
    }

    // Validate status values
    $validStatuses = ['Active', 'Inactive', 'On leave'];
    if (!in_array($status, $validStatuses)) {
        throw new Exception('Invalid status');
    }

    // Check if email already exists for another employee
    $stmt = $conn->prepare("SELECT id FROM employee WHERE email = ? AND id != ?");
    $stmt->bind_param("si", $email, $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        throw new Exception('Email already exists');
    }

    // Build update query based on whether password is provided
    if (!empty($password)) {
        $stmt = $conn->prepare("UPDATE employee SET name = ?, position = ?, email = ?, phone = ?, status = ?, password = ? WHERE id = ?");
        $stmt->bind_param("ssssssi", $name, $position, $email, $phone, $status, $password, $id);
    } else {
        $stmt = $conn->prepare("UPDATE employee SET name = ?, position = ?, email = ?, phone = ?, status = ? WHERE id = ?");
        $stmt->bind_param("sssssi", $name, $position, $email, $phone, $status, $id);
    }

    if (!$stmt->execute()) {
        throw new Exception("Failed to update employee: " . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception("No changes made or employee not found");
    }

    echo json_encode([
        'success' => true,
        'message' => 'Employee updated successfully'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();