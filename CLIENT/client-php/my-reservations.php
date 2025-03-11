<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// Start session
session_start();

try {
    require_once 'conn.php';

    // Verify database connection
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Check if user is logged in
    if (!isset($_SESSION['customer_id'])) {
        throw new Exception("User not logged in");
    }

    $customerID = $_SESSION['customer_id'];

    // Handle different API actions
    $action = $_GET['action'] ?? 'list';

    switch ($action) {
        case 'list':
            getReservations($customerID);
            break;
        case 'details':
            $reservationId = $_GET['id'] ?? null;
            if ($reservationId) {
                getReservationDetails($customerID, $reservationId);
            }
            break;
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
    exit;
}

function getReservations($customerID) {
    global $conn;
    
    try {
        $query = "
            SELECT 
                r.id as reservation_id,
                r.startDate as pickup_date,
                r.endDate as return_date,
                r.status as reservation_status,
                c.plate_number,
                c.daily_rate,
                CONCAT(cb.brand_name, ' ', cm.model_name) as car_name
            FROM reservation r
            JOIN cars c ON r.carID = c.car_id
            JOIN car_models cm ON c.model_id = cm.model_id
            JOIN car_brand cb ON cm.brand_id = cb.brand_id
            WHERE r.customerID = ?
            ORDER BY r.startDate DESC
        ";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("i", $customerID);
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        $reservations = [];
        
        while ($row = $result->fetch_assoc()) {
            $reservations[] = [
                'reservation_id' => $row['reservation_id'],
                'car_name' => $row['car_name'],
                'plate_number' => $row['plate_number'],
                'pickup_date' => date('Y-m-d', strtotime($row['pickup_date'])),
                'return_date' => date('Y-m-d', strtotime($row['return_date'])),
                'reservation_status' => $row['reservation_status'],
                'daily_rate' => number_format($row['daily_rate'], 2)
            ];
        }
        
        echo json_encode($reservations);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => $e->getMessage()
        ]);
    }
}

function getReservationDetails($customerID, $reservationId) {
    global $conn;
    
    $query = "
        SELECT 
            r.id,
            r.startDate,
            r.endDate,
            r.status,
            c.plate_number,
            c.year,
            c.daily_rate,
            cb.brand_name,
            cm.model_name
        FROM reservation r
        JOIN cars c ON r.carID = c.car_id
        JOIN car_models cm ON c.model_id = cm.model_id
        JOIN car_brand cb ON cm.brand_id = cb.brand_id
        WHERE r.customerID = ? AND r.id = ?
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $customerID, $reservationId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $row['startDate'] = date('Y-m-d', strtotime($row['startDate']));
        $row['endDate'] = date('Y-m-d', strtotime($row['endDate']));
        $row['car_name'] = $row['brand_name'] . ' ' . $row['model_name'];
        unset($row['brand_name'], $row['model_name']); // Remove separate brand and model fields
        echo json_encode($row);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Reservation not found']);
    }
}
?>
