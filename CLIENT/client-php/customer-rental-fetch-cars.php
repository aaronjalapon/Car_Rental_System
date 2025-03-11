<?php
include_once 'conn.php';
header('Content-Type: application/json');

try {
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $type = isset($_GET['type']) ? $_GET['type'] : '';
    $maxPrice = isset($_GET['max_price']) ? $_GET['max_price'] : '';
    $sort = isset($_GET['sort']) ? $_GET['sort'] : '';

    $query = "SELECT c.*, b.brand_name, m.model_name, t.bodyType_name, 
              CONCAT('/CSE7-PROJECT/Car_Rental_System(revised3)/', m.image) as image_url
              FROM cars c
              LEFT JOIN car_models m ON c.model_id = m.model_id
              LEFT JOIN car_brand b ON m.brand_id = b.brand_id
              LEFT JOIN car_bodytype t ON m.bodyType_id = t.bodyType_id
              WHERE 1=1";

    $params = array();
    
    // Add search condition
    if (!empty($search)) {
        $searchTerm = "%$search%";
        $query .= " AND (
            b.brand_name LIKE ? OR 
            m.model_name LIKE ? OR 
            c.plate_number LIKE ? OR
            CONCAT(b.brand_name, ' ', m.model_name) LIKE ?
        )";
        $params = array_merge($params, array($searchTerm, $searchTerm, $searchTerm, $searchTerm));
    }

    // Add type filter
    if (!empty($type)) {
        $query .= " AND t.bodyType_name = ?";
        $params[] = $type;
    }

    // Add price filter
    if (!empty($maxPrice)) {
        $query .= " AND c.daily_rate <= ?";
        $params[] = $maxPrice;
    }

    // Add sorting
    switch ($sort) {
        case 'price-asc':
            $query .= " ORDER BY c.daily_rate ASC";
            break;
        case 'price-desc':
            $query .= " ORDER BY c.daily_rate DESC";
            break;
        case 'name':
            $query .= " ORDER BY b.brand_name ASC, m.model_name ASC";
            break;
        default:
            $query .= " ORDER BY c.car_id DESC";
    }

    $stmt = $conn->prepare($query);
    
    if (!empty($params)) {
        $types = str_repeat('s', count($params));
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $cars = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => ['cars' => $cars]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>
