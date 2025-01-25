<?php
include("../php/conn.php");

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id > 0) {
    // Prepare the SQL statement
    $stmt = $conn->prepare("SELECT dlpic FROM customer WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->store_result();
    $stmt->bind_result($dlpic);
    $stmt->fetch();

    if ($dlpic) {
        // Set the content type header to display the image
        header("Content-Type: image/jpeg");  // Adjust the MIME type accordingly (image/jpeg, image/png, etc.)
        echo $dlpic;
    } else {
        echo "No image found for the specified ID.";
    }

    $stmt->close();
} else {
    echo "Invalid ID.";
}

$conn->close();
?>