<?php
include_once 'conn.php';

header('Content-Type: application/json');

try {
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    
    $query = "SELECT 
                id,
                name,
                position,
                email,
                phone,
                status
            FROM employee 
            WHERE 1=1";
            
    if (!empty($search)) {
        $search = "%$search%";
        $query .= " AND (
            name LIKE ? OR 
            position LIKE ? OR 
            email LIKE ? OR 
            phone LIKE ?
        )";
    }
    
    $query .= " ORDER BY name";
    
    $stmt = $conn->prepare($query);
    
    if (!empty($search)) {
        $stmt->bind_param("ssss", $search, $search, $search, $search);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to fetch employees");
    }

    $result = $stmt->get_result();
    $employees = $result->fetch_all(MYSQLI_ASSOC);

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
