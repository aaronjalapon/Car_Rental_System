<?php
include("../php/conn.php");

header('Content-Type: application/json');

$response = array();

try {
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        // Get the input data
        $email = filter_input(INPUT_POST, "email", FILTER_SANITIZE_EMAIL);
        $password = $_POST["password"];

        if (empty($email) || empty($password)) {
            throw new Exception('Please fill in all fields.');
        }

        // Prepare the SQL statement
        $stmt = $conn->prepare("SELECT id, password FROM customer WHERE email = ?");
        if (!$stmt) {
            throw new Exception('Prepare statement failed: ' . $conn->error);
        }
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $stmt->bind_result($id, $hashedPassword);
            $stmt->fetch();

            // Verify the password
            if (password_verify($password, $hashedPassword)) {
                // Check if the user is admin
                if ($email === 'admin@gmail.com') {
                    $response['status'] = 'admin';
                    $response['message'] = 'Login successful!';
                } else {
                    $response['status'] = 'user';
                    $response['message'] = 'Login successful!';
                }
            } else {
                throw new Exception('Invalid email or password. Please try again.');
            }
        } else {
            throw new Exception('Invalid email or password. Please try again.');
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

echo json_encode($response);
?>