<?php
session_start();
require_once 'conn.php';
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

$userId = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch user profile data
    try {
        $query = "SELECT name, email, contact, address, license FROM customer WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($profile = $result->fetch_assoc()) {
            echo json_encode(['success' => true, 'data' => $profile]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Profile not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Update user profile data
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "UPDATE customer SET name = ?, email = ?, contact = ?, address = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ssssi", 
            $data['fullName'],
            $data['email'],
            $data['phone'],
            $data['address'],
            $userId
        );

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
        } else {
            throw new Exception('Failed to update profile');
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

$conn->close();
?>
