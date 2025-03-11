<?php
require_once 'conn.php';

if (isset($_GET['id'])) {
    try {
        $query = "SELECT daily_rate FROM cars WHERE car_id = ?";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, "i", $_GET['id']);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        
        if ($row = mysqli_fetch_assoc($result)) {
            echo json_encode([
                'success' => true,
                'daily_rate' => $row['daily_rate']
            ]);
        } else {
            throw new Exception("Car not found");
        }
    } catch(Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No car ID provided'
    ]);
}
?>
