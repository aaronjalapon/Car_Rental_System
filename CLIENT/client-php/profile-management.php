<?php
session_start();
require_once '../../MAIN/main-php/conn.php';
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['customer_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$customerId = $_SESSION['customer_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->prepare("
            SELECT 
                c.*,
                (SELECT MAX(r.startDate) 
                 FROM reservation r 
                 WHERE r.customerID = c.id AND r.status = 'done') as lastRental
            FROM customer c
            WHERE c.id = ?
        ");
        
        $stmt->bind_param("i", $customerId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($customer = $result->fetch_assoc()) {
            // Format the lastRental date if it exists
            $lastRental = $customer['lastRental'] ? date('Y-m-d', strtotime($customer['lastRental'])) : null;
            
            // Ensure dlpic path is using the correct directory structure
            $dlpic = $customer['dlpic'];
            if ($dlpic && !str_starts_with($dlpic, 'IMAGES/')) {
                $dlpic = 'IMAGES/customers-drivers-license/' . basename($dlpic);
            }
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $customer['id'],
                    'name' => $customer['name'],
                    'email' => $customer['email'],
                    'contact' => $customer['contact'],
                    'dlpic' => $dlpic,
                    'license_verified' => (int)$customer['license_verified'],
                    'lastRental' => $lastRental
                ]
            ]);
        } else {
            throw new Exception('Customer not found');
        }
    } catch (Exception $e) {
        http_response_code(500);
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
            $customerId
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
