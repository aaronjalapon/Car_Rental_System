<?php
require_once 'conn.php';

try {
    // Add status column to reservation table
    $alterQuery = "ALTER TABLE reservation 
                  ADD COLUMN status ENUM('ongoing', 'done') NOT NULL DEFAULT 'ongoing'";
    
    if (mysqli_query($conn, $alterQuery)) {
        echo json_encode(['success' => true, 'message' => 'Status column added successfully']);
    } else {
        throw new Exception("Error adding status column: " . mysqli_error($conn));
    }
} catch(Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
