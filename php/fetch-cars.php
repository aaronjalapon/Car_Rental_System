<?php
include_once 'conn.php';
header('Content-Type: application/json');

function sendResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

try {
    $query = "SELECT c.car_id, c.plate_number, c.year, c.daily_rate, c.status,
                     cm.model_name, cb.brand_name, ct.bodyType_name,
                     cm.image
              FROM cars c
              JOIN car_models cm ON c.model_id = cm.model_id
              JOIN car_brand cb ON cm.brand_id = cb.brand_id
              JOIN car_bodytype ct ON cm.bodyType_id = ct.bodyType_id
              WHERE c.status = 'Available'";

    // Apply filters if they exist
    $params = [];
    $types = "";

    if (isset($_GET['type']) && !empty($_GET['type'])) {
        $query .= " AND ct.bodyType_name = ?";
        $params[] = $_GET['type'];
        $types .= "s";
    }

    if (isset($_GET['max_price']) && !empty($_GET['max_price'])) {
        $query .= " AND c.daily_rate <= ?";
        $params[] = $_GET['max_price'];
        $types .= "d";
    }

    // Add sorting
    if (isset($_GET['sort'])) {
        switch ($_GET['sort']) {
            case 'price-asc':
                $query .= " ORDER BY c.daily_rate ASC";
                break;
            case 'price-desc':
                $query .= " ORDER BY c.daily_rate DESC";
                break;
            case 'name':
                $query .= " ORDER BY cb.brand_name, cm.model_name";
                break;
        }
    }

    $stmt = $conn->prepare($query);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $cars = [];
    while ($row = $result->fetch_assoc()) {
        // Convert BLOB image to base64
        $imageData = base64_encode($row['image']);
        $row['image'] = 'data:image/jpeg;base64,' . $imageData;
        $cars[] = $row;
    }

    sendResponse(true, ['cars' => $cars]);

} catch (Exception $e) {
    sendResponse(false, null, 'Error fetching cars: ' . $e->getMessage());
}

$conn->close();
?>
