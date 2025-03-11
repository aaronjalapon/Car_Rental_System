<?php
// session_start(); // Temporarily commented out
require_once 'conn.php';

// if (isset($_SESSION['employee_id'])) { // Temporarily commented out
    try {
        // Temporarily hardcoded employee ID
        $employee_id = 6; // Admin User ID
        
        $query = "SELECT id, name FROM employee WHERE id = ? AND status = 'Active'";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, "i", $employee_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        
        if ($row = mysqli_fetch_assoc($result)) {
            echo json_encode([
                'success' => true,
                'id' => $row['id'],
                'name' => $row['name']
            ]);
        } else {
            throw new Exception("Employee not found");
        }
    } catch(Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
// } else { // Temporarily commented out
//     echo json_encode([
//         'success' => false,
//         'message' => 'No employee logged in'
//     ]);
// } // Temporarily commented out
?>
