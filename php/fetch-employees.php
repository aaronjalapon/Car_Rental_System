<?php
include_once 'conn.php';

header('Content-Type: application/json');

try {
    $stmt = $conn->prepare("
        SELECT id as employeeID, 
               name as employee_name 
        FROM employee 
        WHERE status = 'Active' 
        ORDER BY name
    ");
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to fetch employees");
    }

    $result = $stmt->get_result();
    $employees = $result->fetch_all(MYSQLI_ASSOC);
    
    if (empty($employees)) {
        throw new Exception("No active employees found");
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'employees' => $employees
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
