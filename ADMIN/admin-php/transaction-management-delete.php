<?php
include '../../CONFIG/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = array();
    
    // Get the transaction ID from POST data
    $transactionId = isset($_POST['id']) ? intval($_POST['id']) : 0;
    
    if ($transactionId > 0) {
        // Prepare and execute the delete query
        $query = "DELETE FROM transactions WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $transactionId);
        
        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = "Transaction deleted successfully";
        } else {
            $response['success'] = false;
            $response['message'] = "Error deleting transaction: " . $conn->error;
        }
        
        $stmt->close();
    } else {
        $response['success'] = false;
        $response['message'] = "Invalid transaction ID";
    }
    
    echo json_encode($response);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}

$conn->close();
?>
