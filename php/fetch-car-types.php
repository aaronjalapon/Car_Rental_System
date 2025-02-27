<?php
include_once 'conn.php';
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
    $query = "SELECT DISTINCT bodyType_name FROM car_bodytype ORDER BY bodyType_name";
    $result = $conn->query($query);
    
    $types = [];
    while ($row = $result->fetch_assoc()) {
        $types[] = $row['bodyType_name'];
    }
    
    sendResponse(true, ['types' => $types]);

} catch (Exception $e) {
    sendResponse(false, null, 'Error fetching car types: ' . $e->getMessage());
}

$conn->close();
?>
