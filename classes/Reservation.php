<?php
class Reservation {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getUserReservations($userId) {
        try {
            $query = "SELECT 
                        r.id AS reservation_id,
                        c.model AS car_model,
                        c.image AS car_image,
                        r.startDate AS pickup_date,
                        r.endDate AS return_date,
                        t.status AS payment_status,
                        t.totalAmount,
                        r.status AS reservation_status,
                        r.notes
                    FROM Reservation r
                    LEFT JOIN Cars c ON r.carID = c.id
                    LEFT JOIN Transaction t ON r.id = t.reservationID
                    WHERE r.userID = :userId
                    ORDER BY r.startDate DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();

            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // If no reservations found, return empty array
            if (!$result) {
                return [];
            }

            return $result;
            
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    public function getReservationDetails($reservationId, $userId) {
        $query = "SELECT 
                    r.id AS reservation_id,
                    r.startDate AS pickup_date,
                    r.endDate AS return_date,
                    c.model AS car_model,
                    c.image AS car_image,
                    t.totalAmount,
                    t.status AS payment_status,
                    r.status AS reservation_status,
                    r.notes
                FROM Reservation r
                JOIN Transaction t ON r.id = t.reservationID
                LEFT JOIN Cars c ON r.carID = c.id
                WHERE r.id = :reservationId AND r.userID = :userId";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':reservationId', $reservationId);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            throw new Exception('Reservation not found');
        }

        return $result;
    }
}
