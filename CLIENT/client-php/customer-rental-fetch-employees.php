<?php
include_once 'conn.php';  // Updated to use local conn.php
header('Content-Type: application/json');

function sendResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

try {
    // Simplified query to get all active employees
    $query = "SELECT id as employeeID, name as employee_name, position 
              FROM employee 
              WHERE status = 'Active'";
              
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Database query failed");
    }
    
    $employees = [];
    while ($row = $result->fetch_assoc()) {
        $employees[] = $row;
    }
    
    if (empty($employees)) {
        sendResponse(false, null, 'No active employees found');
    } else {
        sendResponse(true, ['employees' => $employees]);
    }

} catch (Exception $e) {
    sendResponse(false, null, 'Error fetching employees: ' . $e->getMessage());
}

$conn->close();
?>
