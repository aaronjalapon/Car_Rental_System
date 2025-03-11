<?php
header('Content-Type: application/json');
require_once '../../MAIN/main-php/conn.php';

try {
    if (!isset($_GET['id'])) {
        throw new Exception('Employee ID is required');
    }

    $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
    if ($id === false) {
        throw new Exception('Invalid employee ID');
    }

    $stmt = $conn->prepare("SELECT id, name, position, email, phone, status FROM employee WHERE id = ?");
    if (!$stmt) {
        throw new Exception("Database error: " . $conn->error);
    }

    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('Employee not found');
    }

    $employee = $result->fetch_assoc();
    echo json_encode([
        'success' => true,
        'data' => $employee
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();