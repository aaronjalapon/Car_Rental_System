<?php
require_once 'conn.php';

try {
    $query = "SELECT c.car_id as id, 
              CONCAT(cb.brand_name, ' ', cm.model_name, ' (', c.plate_number, ')') as model,
              c.daily_rate
              FROM cars c 
              JOIN car_models cm ON c.model_id = cm.model_id
              JOIN car_brand cb ON cm.brand_id = cb.brand_id 
              WHERE c.status = 'Available' 
              ORDER BY cb.brand_name, cm.model_name";
              
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        throw new Exception(mysqli_error($conn));
    }
    
    $cars = array();
    while($row = mysqli_fetch_assoc($result)) {
        $cars[] = $row;
    }
    
    echo json_encode($cars);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => $e->getMessage()));
}
?>
