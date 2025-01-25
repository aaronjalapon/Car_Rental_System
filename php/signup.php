<?php
include("../php/conn.php");

header('Content-Type: application/json');

$response = array();

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Clear any existing output buffer to prevent HTML output
ob_clean();

try {
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        // Sanitize and validate email input
        $email = filter_input(INPUT_POST, "email", FILTER_SANITIZE_EMAIL);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format.');
        }

        // Retrieve and validate other inputs
        $fname = filter_input(INPUT_POST, "fname", FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $lname = filter_input(INPUT_POST, "lname", FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $contact = filter_input(INPUT_POST, "contact", FILTER_SANITIZE_NUMBER_INT);
        $password = $_POST["password"];
        $confirmPassword = $_POST["confirmPassword"];

        if (empty($fname) || empty($lname) || empty($email) || empty($contact) || empty($password) || empty($confirmPassword)) {
            throw new Exception('All fields are required.');
        }
        if ($password !== $confirmPassword) {
            throw new Exception('Passwords do not match.');
        }

        // Check if email already exists
        $emailCheckStmt = $conn->prepare("SELECT id FROM customer WHERE email = ?");
        if (!$emailCheckStmt) {
            throw new Exception('Prepare statement failed: ' . $conn->error);
        }
        $emailCheckStmt->bind_param("s", $email);
        $emailCheckStmt->execute();
        $emailCheckStmt->store_result();

        if ($emailCheckStmt->num_rows > 0) {
            throw new Exception('Email is already in use.');
        }

        // Handle image upload
        if (isset($_FILES['dlpic']) && $_FILES['dlpic']['error'] == 0) {
            $allowed = ['jpg', 'jpeg', 'png', 'gif'];
            $fileName = $_FILES['dlpic']['name'];
            $fileTmpName = $_FILES['dlpic']['tmp_name'];
            $fileSize = $_FILES['dlpic']['size'];
            $fileError = $_FILES['dlpic']['error'];
            $fileType = $_FILES['dlpic']['type'];

            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            if (!in_array($fileExt, $allowed)) {
                throw new Exception('Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed.');
            }

            if ($fileSize > 10000000) { // 10MB limit
                throw new Exception('File size is too large. Maximum allowed size is 10MB.');
            }

            $fileContent = file_get_contents($fileTmpName);
        } else {
            throw new Exception('Image upload failed.');
        }

        // Hash the password before storing it
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Prepare the SQL statement
        $stmt = $conn->prepare("INSERT INTO customer (fname, lname, email, contact, password, dlpic) VALUES (?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception('Prepare statement failed: ' . $conn->error);
        }
        // Bind the parameters including the BLOB data
        $stmt->bind_param("sssssb", $fname, $lname, $email, $contact, $hashedPassword, $null);
        $stmt->send_long_data(5, $fileContent);

        if ($stmt->execute()) {
            $response['status'] = 'success';
            $response['message'] = 'Sign up successful.';
        } else {
            throw new Exception('Error: ' . $stmt->error);
        }

        $stmt->close();
        mysqli_close($conn);
    } else {
        throw new Exception('Invalid request method.');
    }
} catch (Exception $e) {
    $response['status'] = 'error';
    $response['message'] = $e->getMessage();
}

// Ensure no additional output is sent
ob_end_clean();
echo json_encode($response);
?>