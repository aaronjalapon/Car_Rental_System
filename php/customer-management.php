<?php
require_once 'conn.php';
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Initialize variables for pagination
$itemsPerPage = isset($_GET['items_per_page']) ? (int)$_GET['items_per_page'] : 10;
$currentPage = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($currentPage - 1) * $itemsPerPage;

// Search functionality
$search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
$searchCondition = '';
if (!empty($search)) {
    $searchCondition = " WHERE name LIKE '%$search%' OR email LIKE '%$search%' OR contact LIKE '%$search%'";
}

// Sorting
$sortField = isset($_GET['sort']) ? $_GET['sort'] : 'id';
$allowedSortFields = ['name', 'id', 'lastRental'];
if (!in_array($sortField, $allowedSortFields)) {
    $sortField = 'id';
}
$sortOrder = " ORDER BY $sortField";

try {
    // Verify database connection
    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    // Get total number of records for pagination
    $countQuery = "SELECT COUNT(*) as total FROM carrentalservices.customer" . $searchCondition;
    $countResult = $conn->query($countQuery);
    if (!$countResult) {
        throw new Exception("Count query failed: " . $conn->error);
    }
    $totalRecords = $countResult->fetch_assoc()['total'];
    $totalPages = ceil($totalRecords / $itemsPerPage);

    // Get customer data - IMPORTANT: Exclude dlpic from main list query
    $query = "SELECT id, name, email, contact, 
              CASE 
                WHEN license_verified = 1 THEN 'verified'
                WHEN license_verified = 0 THEN 'invalid'
                ELSE 'pending'
              END as license_status,
              lastRental 
              FROM carrentalservices.customer" . 
             $searchCondition . $sortOrder . 
             " LIMIT ? OFFSET ?";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }
    
    $stmt->bind_param("ii", $itemsPerPage, $offset);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    if (!$result) {
        throw new Exception("Get result failed: " . $stmt->error);
    }

    $customers = [];
    while ($row = $result->fetch_assoc()) {
        $customers[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'contact' => $row['contact'],
            'license_status' => $row['license_status'],
            'lastRental' => $row['lastRental'] ?? null
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'customers' => $customers,
            'pagination' => [
                'currentPage' => $currentPage,
                'totalPages' => $totalPages,
                'itemsPerPage' => $itemsPerPage,
                'totalRecords' => $totalRecords
            ]
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    error_log("Error in customer management: " . $e->getMessage());
}

if (isset($stmt)) {
    $stmt->close();
}
if (isset($conn)) {
    $conn->close();
}
?>