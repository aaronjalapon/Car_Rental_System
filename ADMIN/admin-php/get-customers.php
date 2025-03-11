<?php
require_once 'conn.php';

try {
    $query = "SELECT id, name FROM customer ORDER BY name";
    $result = mysqli_query($conn, $query);
    
    $customers = array();
    while($row = mysqli_fetch_assoc($result)) {
        $customers[] = $row;
    }
    
    echo json_encode($customers);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => $e->getMessage()));
}
?>
