<?php

$dbserver = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname = "carrentalservices";
$conn = null;

try {
    $conn = new mysqli($dbserver, $dbusername, $dbpassword, $dbname);

    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

} catch (Exception $e) {
    echo "<script type='text/javascript'>
            alert('Error: " . $e->getMessage() . "' );
          </script>";
}

?>