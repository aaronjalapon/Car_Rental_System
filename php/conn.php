<?php
$servername = "127.0.0.1"; // Using IP instead of 'localhost'
$username = "root";
$password = "";
$dbname = "carrentalservices";
$port = 3306; // Default MySQL port

try {
    // Create connection with error handling
    $conn = new mysqli($servername, $username, $password, $dbname, $port);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Set charset to UTF-8
    $conn->set_charset("utf8mb4");

} catch (Exception $e) {
    // Log the error and provide a user-friendly message
    error_log("Database connection error: " . $e->getMessage());
    die("Database connection error. Please try again later.");
}
?>