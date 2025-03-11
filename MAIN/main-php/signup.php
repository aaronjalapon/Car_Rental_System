<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); // Enable errors for debugging
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

header('Content-Type: application/json');

try {
    require_once("conn.php"); // Changed path to use local conn.php
    
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception('Invalid request method');
    }

    // Log incoming data
    error_log("POST data: " . print_r($_POST, true));
    error_log("FILES data: " . print_r($_FILES, true));

    // Validate required fields
    $required = ['name', 'email', 'contact', 'password', 'confirmPassword'];
    foreach ($required as $field) {
        if (empty($_POST[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    // Validate image upload
    if (!isset($_FILES['dlpic']) || $_FILES['dlpic']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Driver\'s license image is required');
    }

    // Process and save image
    $uploadDir = __DIR__ . '/../../IMAGES/customers-drivers-license/';
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            throw new Exception("Failed to create upload directory: " . $uploadDir);
        }
    }

    $file = $_FILES['dlpic'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("File upload error: " . $file['error']);
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png'])) {
        throw new Exception('Invalid file type. Only JPG and PNG are allowed.');
    }

    $fileName = uniqid() . '.' . $ext;
    $filePath = $uploadDir . $fileName;
    $dbImagePath = 'IMAGES/customers-drivers-license/' . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        throw new Exception('Failed to save image file');
    }

    // Database operations
    $stmt = $conn->prepare("INSERT INTO customer (name, email, contact, password, dlpic, license_verified) VALUES (?, ?, ?, ?, ?, 0)");
    if (!$stmt) {
        throw new Exception("Database prepare failed: " . $conn->error);
    }

    $hashedPassword = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $stmt->bind_param("sssss", 
        $_POST['name'],
        $_POST['email'],
        $_POST['contact'],
        $hashedPassword,
        $dbImagePath
    );

    if (!$stmt->execute()) {
        // If database insert fails, remove the uploaded file
        unlink($filePath);
        throw new Exception("Failed to create account: " . $stmt->error);
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Registration successful',
        'data' => [
            'email' => $_POST['email'],
            'image_path' => $dbImagePath
        ]
    ]);

} catch (Exception $e) {
    error_log("Signup error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>