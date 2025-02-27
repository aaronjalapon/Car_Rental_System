<?php
include_once 'conn.php';
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Helper function to send JSON response
function sendResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

// GET: Fetch rentals with filtering and pagination
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $itemsPerPage = isset($_GET['items_per_page']) ? (int)$_GET['items_per_page'] : 10;
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $status = isset($_GET['status']) ? $_GET['status'] : '';

    $offset = ($page - 1) * $itemsPerPage;
    
    try {
        // Base query
        $query = "SELECT r.rental_id, c.car_id, c.plate_number, cm.model_name, 
                         cb.brand_name, cus.name as customer_name, 
                         r.pickup_date, r.return_date, r.total_amount, r.status
                  FROM rentals r
                  JOIN cars c ON r.car_id = c.car_id
                  JOIN car_models cm ON c.model_id = cm.model_id
                  JOIN car_brand cb ON cm.brand_id = cb.brand_id
                  JOIN customers cus ON r.customer_id = cus.customer_id
                  WHERE 1=1";
        
        $params = [];
        $types = "";

        // Add search condition
        if (!empty($search)) {
            $query .= " AND (cus.name LIKE ? OR c.plate_number LIKE ? OR cm.model_name LIKE ?)";
            $searchTerm = "%$search%";
            array_push($params, $searchTerm, $searchTerm, $searchTerm);
            $types .= "sss";
        }

        // Add status filter
        if (!empty($status)) {
            $query .= " AND r.status = ?";
            array_push($params, $status);
            $types .= "s";
        }

        // Add pagination
        $query .= " LIMIT ? OFFSET ?";
        array_push($params, $itemsPerPage, $offset);
        $types .= "ii";

        // Prepare and execute the query
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        
        $rentals = [];
        while ($row = $result->fetch_assoc()) {
            $rentals[] = $row;
        }

        // Get total count for pagination
        $countQuery = "SELECT COUNT(*) as total FROM rentals r
                      JOIN cars c ON r.car_id = c.car_id
                      JOIN car_models cm ON c.model_id = cm.model_id
                      JOIN customers cus ON r.customer_id = cus.customer_id
                      WHERE 1=1";
        
        // Add the same search and status conditions
        if (!empty($search)) {
            $countQuery .= " AND (cus.name LIKE ? OR c.plate_number LIKE ? OR cm.model_name LIKE ?)";
        }
        if (!empty($status)) {
            $countQuery .= " AND r.status = ?";
        }

        $countStmt = $conn->prepare($countQuery);
        if (!empty($params)) {
            // Remove the last two parameters (LIMIT and OFFSET)
            array_pop($params);
            array_pop($params);
            $types = substr($types, 0, -2);
            if (!empty($params)) {
                $countStmt->bind_param($types, ...$params);
            }
        }
        $countStmt->execute();
        $totalResult = $countStmt->get_result();
        $totalRows = $totalResult->fetch_assoc()['total'];

        sendResponse(true, [
            'rentals' => $rentals,
            'pagination' => [
                'currentPage' => $page,
                'totalPages' => ceil($totalRows / $itemsPerPage),
                'totalItems' => $totalRows,
                'itemsPerPage' => $itemsPerPage
            ]
        ]);

    } catch (Exception $e) {
        sendResponse(false, null, 'Database error: ' . $e->getMessage());
    }
}

// POST: Create new rental
else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $requiredFields = ['car_id', 'customer_id', 'pickup_date', 'return_date', 'total_amount'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                sendResponse(false, null, "Missing required field: $field");
            }
        }

        // Begin transaction
        $conn->begin_transaction();

        // Check if car is available
        $checkCarQuery = "SELECT status FROM cars WHERE car_id = ? AND status = 'Available'";
        $stmt = $conn->prepare($checkCarQuery);
        $stmt->bind_param("i", $data['car_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $conn->rollback();
            sendResponse(false, null, 'Car is not available for rental');
        }

        // Insert rental record
        $query = "INSERT INTO rentals (car_id, customer_id, pickup_date, return_date, total_amount, status) 
                 VALUES (?, ?, ?, ?, ?, 'Pending')";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param("iissd", 
            $data['car_id'],
            $data['customer_id'],
            $data['pickup_date'],
            $data['return_date'],
            $data['total_amount']
        );
        
        if ($stmt->execute()) {
            // Update car status
            $updateCarQuery = "UPDATE cars SET status = 'Unavailable' WHERE car_id = ?";
            $stmt = $conn->prepare($updateCarQuery);
            $stmt->bind_param("i", $data['car_id']);
            $stmt->execute();

            $conn->commit();
            sendResponse(true, ['rental_id' => $conn->insert_id], 'Rental created successfully');
        } else {
            $conn->rollback();
            sendResponse(false, null, 'Failed to create rental');
        }

    } catch (Exception $e) {
        $conn->rollback();
        sendResponse(false, null, 'Error creating rental: ' . $e->getMessage());
    }
}

// PUT: Update rental status
else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['rental_id']) || !isset($data['status'])) {
            sendResponse(false, null, 'Rental ID and status are required');
        }

        $conn->begin_transaction();

        $query = "UPDATE rentals SET status = ? WHERE rental_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("si", $data['status'], $data['rental_id']);
        
        if ($stmt->execute()) {
            // If rental is completed or cancelled, update car status to Available
            if (in_array($data['status'], ['Completed', 'Cancelled'])) {
                $updateCarQuery = "UPDATE cars c 
                                 JOIN rentals r ON c.car_id = r.car_id 
                                 SET c.status = 'Available' 
                                 WHERE r.rental_id = ?";
                $stmt = $conn->prepare($updateCarQuery);
                $stmt->bind_param("i", $data['rental_id']);
                $stmt->execute();
            }

            $conn->commit();
            sendResponse(true, null, 'Rental status updated successfully');
        } else {
            $conn->rollback();
            sendResponse(false, null, 'Failed to update rental status');
        }

    } catch (Exception $e) {
        $conn->rollback();
        sendResponse(false, null, 'Error updating rental: ' . $e->getMessage());
    }
}

// DELETE: Cancel rental
else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $rental_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        if ($rental_id === 0) {
            sendResponse(false, null, 'Rental ID is required');
        }

        $conn->begin_transaction();

        // Update rental status to Cancelled
        $query = "UPDATE rentals SET status = 'Cancelled' WHERE rental_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $rental_id);
        
        if ($stmt->execute()) {
            // Update car status to Available
            $updateCarQuery = "UPDATE cars c 
                             JOIN rentals r ON c.car_id = r.car_id 
                             SET c.status = 'Available' 
                             WHERE r.rental_id = ?";
            $stmt = $conn->prepare($updateCarQuery);
            $stmt->bind_param("i", $rental_id);
            $stmt->execute();

            $conn->commit();
            sendResponse(true, null, 'Rental cancelled successfully');
        } else {
            $conn->rollback();
            sendResponse(false, null, 'Failed to cancel rental');
        }

    } catch (Exception $e) {
        $conn->rollback();
        sendResponse(false, null, 'Error cancelling rental: ' . $e->getMessage());
    }
}

$conn->close();
?>
