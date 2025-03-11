<?php
require_once 'conn.php';

try {
    $query = "SELECT id, name FROM employee WHERE status = 'Active'";
    $result = mysqli_query($conn, $query);
    
    $employees = array();
    while($row = mysqli_fetch_assoc($result)) {
        $employees[] = $row;
    }
    
    echo json_encode($employees);
} catch(Exception $e) {
    echo json_encode([]);
}
?>
