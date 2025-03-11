<?php
header('Content-Type: application/json');

try {
    echo json_encode([
        'success' => true,
        'message' => 'Valid access'
    ]);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
