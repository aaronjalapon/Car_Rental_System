<?php
session_start();
include_once '../../CLIENT/client-php/conn.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'];
    $password = $data['password'];

    // First check employee table
    $empQuery = "SELECT id, password FROM employee WHERE email = ?";
    $stmt = $conn->prepare($empQuery);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $empResult = $stmt->get_result();
    
    if ($empRow = $empResult->fetch_assoc()) {
        // For employee, assuming password is not hashed in the database
        if ($password === $empRow['password']) {
            // Don't set session for employees
            echo json_encode([
                'success' => true, 
                'role' => 'employee',
                'message' => 'Login successful'
            ]);
            exit;
        }
    }

    // If not employee, check customer table
    $custQuery = "SELECT id, password FROM customer WHERE email = ?";
    $stmt = $conn->prepare($custQuery);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $custResult = $stmt->get_result();
    
    if ($custRow = $custResult->fetch_assoc()) {
        if (password_verify($password, $custRow['password'])) {
            $_SESSION['customer_id'] = $custRow['id'];
            echo json_encode([
                'success' => true,
                'role' => 'customer',
                'message' => 'Login successful'
            ]);
            exit;
        }
    }

    // If no match found
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
?>