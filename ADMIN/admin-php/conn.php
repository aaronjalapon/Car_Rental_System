<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "carrentalservices-1";

try {
    $conn = mysqli_connect($servername, $username, $password, $dbname);

    if (!$conn) {
        throw new Exception("Connection failed: " . mysqli_connect_error());
    }

    // Set charset
    if (!mysqli_set_charset($conn, "utf8mb4")) {
        throw new Exception("Error setting charset: " . mysqli_error($conn));
    }

    // Test the connection
    if (!mysqli_query($conn, "SELECT 1")) {
        throw new Exception("Database connection test failed: " . mysqli_error($conn));
    }

} catch (Exception $e) {
    die(json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]));
}
?>
