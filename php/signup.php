<?php
include("../php/conn.php");

header('Content-Type: application/json');
$response = array();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

ob_clean();

try {
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $email = filter_input(INPUT_POST, "email", FILTER_SANITIZE_EMAIL);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format.');
        }

        $name = filter_input(INPUT_POST, "name", FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $contact = filter_input(INPUT_POST, "contact", FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $password = $_POST["password"] ?? '';
        $confirmPassword = $_POST["confirmPassword"] ?? '';

        if (empty($name) || empty($email) || empty($contact) || empty($password) || empty($confirmPassword)) {
            throw new Exception('All fields are required.');
        }
        
        if ($password !== $confirmPassword) {
            throw new Exception('Passwords do not match.');
        }

        $emailCheckStmt = $conn->prepare("SELECT id FROM customer WHERE email = ?");
        if (!$emailCheckStmt) {
            throw new Exception('Prepare statement failed: ' . $conn->error);
        }
        $emailCheckStmt->bind_param("s", $email);
        $emailCheckStmt->execute();
        $emailCheckStmt->store_result();

        if ($emailCheckStmt->num_rows > 0) {
            $emailCheckStmt->close();
            throw new Exception('Email is already in use.');
        }
        $emailCheckStmt->close();

        $fileContent = null;
        if (isset($_FILES['dlpic']) && $_FILES['dlpic']['error'] == 0) {
            $allowed = ['jpg', 'jpeg', 'png', 'gif'];
            $fileName = $_FILES['dlpic']['name'];
            $fileTmpName = $_FILES['dlpic']['tmp_name'];
            $fileSize = $_FILES['dlpic']['size'];
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

            if (!in_array($fileExt, $allowed)) {
                throw new Exception('Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed.');
            }

            if ($fileSize > 10000000) {
                throw new Exception('File size is too large. Maximum allowed size is 10MB.');
            }

            $fileContent = file_get_contents($fileTmpName);
        } else {
            throw new Exception('Image upload failed.');
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $conn->prepare("INSERT INTO customer (name, email, contact, password, dlpic, lastRental) VALUES (?, ?, ?, ?, ?, NULL)");
        if (!$stmt) {
            throw new Exception('Prepare statement failed: ' . $conn->error);
        }

        $stmt->bind_param("sssss", $name, $email, $contact, $hashedPassword, $fileContent);
        $stmt->send_long_data(4, $fileContent);

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

ob_end_clean();
echo json_encode($response);
?>