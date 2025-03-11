<?php
// Disable all error reporting and warnings
error_reporting(0);
ini_set('display_errors', 0);

require_once 'conn.php';
header('Content-Type: application/json');

function calculatePercentageChange($current, $previous) {
    if ($previous == 0) {
        return [
            'change' => $current > 0 ? 100 : 0,
            'trend' => $current > 0 ? 'positive' : 'neutral'
        ];
    }
    
    $change = (($current - $previous) / $previous) * 100;
    $trend = $change > 0 ? 'positive' : ($change < 0 ? 'negative' : 'neutral');
    
    return [
        'change' => round($change, 1),
        'trend' => $trend
    ];
}

function getTrendData($conn, $timeRange) {
    // Get current period totals
    $currentQuery = "SELECT 
        COALESCE(SUM(t.`totalAmount`), 0) as revenue,
        COUNT(DISTINCT t.`reservationID`) as rentals,
        (SELECT COUNT(*) FROM reservation WHERE status = 'ongoing') as active
    FROM `transaction` t
    WHERE t.`status` = 'Paid'
    AND t.`transactionDate` >= CASE 
        WHEN '{$timeRange}' = 'daily' THEN DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        WHEN '{$timeRange}' = 'weekly' THEN DATE_SUB(CURDATE(), INTERVAL 1 WEEK)
        WHEN '{$timeRange}' = 'monthly' THEN DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        WHEN '{$timeRange}' = 'yearly' THEN DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
        ELSE DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
    END";

    // Get previous period totals
    $previousQuery = "SELECT 
        COALESCE(SUM(t.`totalAmount`), 0) as revenue,
        COUNT(DISTINCT t.`reservationID`) as rentals,
        (SELECT COUNT(*) FROM reservation WHERE status = 'ongoing') as active
    FROM `transaction` t
    WHERE t.`status` = 'Paid'
    AND t.`transactionDate` >= CASE 
        WHEN '{$timeRange}' = 'daily' THEN DATE_SUB(CURDATE(), INTERVAL 2 DAY)
        WHEN '{$timeRange}' = 'weekly' THEN DATE_SUB(CURDATE(), INTERVAL 2 WEEK)
        WHEN '{$timeRange}' = 'monthly' THEN DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
        WHEN '{$timeRange}' = 'yearly' THEN DATE_SUB(CURDATE(), INTERVAL 2 YEAR)
        ELSE DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
    END
    AND t.`transactionDate` < CASE 
        WHEN '{$timeRange}' = 'daily' THEN DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        WHEN '{$timeRange}' = 'weekly' THEN DATE_SUB(CURDATE(), INTERVAL 1 WEEK)
        WHEN '{$timeRange}' = 'monthly' THEN DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        WHEN '{$timeRange}' = 'yearly' THEN DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
        ELSE DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
    END";

    $currentResult = $conn->query($currentQuery);
    $previousResult = $conn->query($previousQuery);

    if (!$currentResult || !$previousResult) {
        throw new Exception("Error calculating trends: " . $conn->error);
    }

    $current = $currentResult->fetch_assoc();
    $previous = $previousResult->fetch_assoc();

    // Calculate trends
    $revenueTrend = calculatePercentageChange($current['revenue'], $previous['revenue']);
    $rentalsTrend = calculatePercentageChange($current['rentals'], $previous['rentals']);
    $activeTrend = calculatePercentageChange($current['active'], $previous['active']);

    return [
        'revenue' => $revenueTrend,
        'rentals' => $rentalsTrend,
        'active' => $activeTrend
    ];
}

function getLatestSalesRate($conn) {
    $query = "SELECT salesRate FROM sales WHERE id = (SELECT MAX(id) FROM sales)";
    $result = $conn->query($query);
    if (!$result) {
        throw new Exception("Error getting latest sales rate: " . $conn->error);
    }
    $row = $result->fetch_assoc();
    return $row ? $row['salesRate'] : 0;
}

function getTotalRevenue($conn, $timeRange) {
    $dateCondition = getDateRangeCondition($timeRange);
    $query = "SELECT COALESCE(SUM(t.`totalAmount`), 0) as total 
              FROM `transaction` t
              WHERE t.`status` = 'Paid' AND {$dateCondition}";

    $result = $conn->query($query);
    if (!$result) {
        throw new Exception("Error calculating total revenue: " . $conn->error);
    }
    
    $row = $result->fetch_assoc();
    $salesRate = getLatestSalesRate($conn);
    
    return [
        'amount' => floatval($row['total']), // Changed to amount and ensure it's a number
        'salesRate' => floatval($salesRate),  // Ensure it's a number
        'trend' => $salesRate >= 0 ? 'positive' : 'negative'
    ];
}

try {
    // Define base query template
    $baseQuery = "SELECT 
                    %s as period,
                    COALESCE(SUM(t.`totalAmount`), 0) as revenue
                  FROM `transaction` t
                  WHERE t.`status` = 'Paid'
                  AND t.`transactionDate` >= %s
                  AND t.`transactionDate` <= CURDATE()
                  GROUP BY %s
                  ORDER BY t.`transactionDate`";

    $timeRange = isset($_GET['timeRange']) ? $_GET['timeRange'] : 'monthly';
    
    $trends = getTrendData($conn, $timeRange);
    $stats = [
        'totalRevenue' => getTotalRevenue($conn, $timeRange),
        'totalRentals' => getTotalRentals($conn, $timeRange),
        'activeRentals' => getActiveRentals($conn),
        'monthlyRevenue' => getMonthlyRevenue($conn, $timeRange),
        'carTypeStats' => getCarTypeStats($conn, $timeRange),
        'trends' => $trends // Add trends data to response
    ];

    echo json_encode([
        'success' => true,
        'data' => $stats,
        'timeRange' => $timeRange
    ]);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error' => true
    ]);
    exit;
}

function getDateRangeCondition($timeRange) {
    $condition = "";
    switch ($timeRange) {
        case 'daily':
            $condition = "DATE(t.`transactionDate`) = CURDATE()";
            break;
        case 'weekly':
            $condition = "YEARWEEK(t.`transactionDate`) = YEARWEEK(CURDATE())";
            break;
        case 'monthly':
            $condition = "YEAR(t.`transactionDate`) = YEAR(CURDATE()) AND MONTH(t.`transactionDate`) = MONTH(CURDATE())";
            break;
        case 'yearly':
            $condition = "YEAR(t.`transactionDate`) = YEAR(CURDATE())";
            break;
        default:
            $condition = "1=1";
    }
    return $condition;
}

function getTotalRentals($conn, $timeRange) {
    $query = "SELECT COUNT(DISTINCT t.`reservationID`) as total 
              FROM `reservation` r 
              JOIN `transaction` t ON r.`id` = t.`reservationID`
              WHERE t.`status` = 'Paid'";
    $result = $conn->query($query);
    if (!$result) {
        throw new Exception("Error getting total rentals: " . $conn->error);
    }
    return (int)($result->fetch_assoc()['total'] ?? 0); // Cast to integer
}

function getActiveRentals($conn) {
    $query = "SELECT COUNT(*) as total FROM reservation WHERE status = 'ongoing'";
    $result = $conn->query($query);
    return (int)($result->fetch_assoc()['total'] ?? 0); // Cast to integer
}

function getMonthlyRevenue($conn, $timeRange) {
    switch ($timeRange) {
        case 'daily':
            // Get last 7 days including today
            $query = "SELECT 
                        dates.date_label as period,
                        COALESCE(SUM(t.`totalAmount`), 0) as revenue
                     FROM (
                        SELECT 
                            DATE_SUB(CURDATE(), INTERVAL n DAY) as date,
                            DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n DAY), '%W') as date_label
                        FROM (
                            SELECT 0 as n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL 
                            SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
                        ) numbers
                     ) dates
                     LEFT JOIN `transaction` t ON DATE(t.`transactionDate`) = dates.date
                        AND t.`status` = 'Paid'
                     GROUP BY dates.date
                     ORDER BY dates.date ASC";
            break;

        case 'weekly':
            // Calculate current week number and year
            $currentWeek = date('W');
            $currentYear = date('Y');
            
            // Generate last 4 weeks including current week
            $query = "SELECT 
                        CONCAT('Week ', WEEK(dates.week_date, 1)) as period,
                        COALESCE(SUM(t.`totalAmount`), 0) as revenue
                     FROM (
                        SELECT DATE_SUB(CURRENT_DATE, INTERVAL (n * 7) DAY) as week_date
                        FROM (
                            SELECT 0 as n UNION ALL SELECT 1 UNION ALL 
                            SELECT 2 UNION ALL SELECT 3
                        ) numbers
                     ) dates
                     LEFT JOIN `transaction` t ON YEARWEEK(t.`transactionDate`, 1) = YEARWEEK(dates.week_date, 1)
                        AND t.`status` = 'Paid'
                     GROUP BY YEARWEEK(dates.week_date, 1)
                     ORDER BY dates.week_date ASC";
            break;

        case 'monthly':
            $query = "SELECT 
                        DATE_FORMAT(dates.month_date, '%M') as period,
                        COALESCE(SUM(t.`totalAmount`), 0) as revenue
                     FROM (
                        SELECT DATE_SUB(CURRENT_DATE, INTERVAL (n-1) MONTH) as month_date
                        FROM (
                            SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
                            UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
                            UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
                        ) numbers
                     ) dates
                     LEFT JOIN `transaction` t ON DATE_FORMAT(t.`transactionDate`, '%Y-%m') = DATE_FORMAT(dates.month_date, '%Y-%m')
                        AND t.`status` = 'Paid'
                     GROUP BY dates.month_date
                     ORDER BY dates.month_date";
            break;
            
        case 'yearly':
            $query = "SELECT 
                        years.year as period,
                        COALESCE(SUM(t.`totalAmount`), 0) as revenue
                     FROM (
                        SELECT YEAR(CURRENT_DATE) - number as year
                        FROM (
                            SELECT 0 as number UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
                            UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
                            UNION SELECT 8 UNION SELECT 9
                        ) numbers
                     ) years
                     LEFT JOIN `transaction` t ON YEAR(t.`transactionDate`) = years.year
                        AND t.`status` = 'Paid'
                     GROUP BY years.year
                     ORDER BY years.year";
            break;
    }

    $result = $conn->query($query);
    if (!$result) {
        throw new Exception("Error getting revenue data: " . $conn->error . "\nQuery: " . $query);
    }

    $revenueData = [];
    while ($row = $result->fetch_assoc()) {
        $revenueData[] = [
            'period' => $row['period'],
            'revenue' => (float)$row['revenue']
        ];
    }

    // Generate sample data if no records
    if (empty($revenueData)) {
        $baseAmount = 2960;
        $periods = [];
        
        switch ($timeRange) {
            case 'daily':
                // Generate last 7 days
                for ($i = 6; $i >= 0; $i--) {
                    $date = date('l', strtotime("-$i days"));
                    $periods[] = $date;
                }
                break;
            case 'weekly':
                // Generate last 4 weeks
                $currentWeek = date('W');
                for ($i = 3; $i >= 0; $i--) {
                    $weekNum = $currentWeek - $i;
                    $periods[] = "Week $weekNum";
                }
                break;
            default:
                $periods = getDefaultPeriods($timeRange);
        }

        foreach ($periods as $index => $period) {
            $variation = mt_rand(-20, 20) / 100;
            $revenueData[] = [
                'period' => $period,
                'revenue' => round($baseAmount * (1 + $variation), 2)
            ];
        }
    }

    return $revenueData;
}

function getDefaultPeriods($timeRange) {
    switch ($timeRange) {
        case 'daily':
            return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        case 'weekly':
            return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        case 'monthly':
            return ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
        case 'yearly':
            $currentYear = date('Y');
            $years = [];
            for ($i = 10; $i > 0; $i--) {
                $years[] = (string)($currentYear - $i + 1);
            }
            return $years;
        default:
            return [];
    }
}

function getCarTypeStats($conn, $timeRange) {
    switch ($timeRange) {
        case 'daily':
            return getDailyCarTypeStats($conn);
        case 'weekly':
            return getWeeklyCarTypeStats($conn);
        case 'monthly':
            return getMonthlyCarTypeStats($conn);
        case 'yearly':
            return getYearlyCarTypeStats($conn);
        default:
            return getMonthlyCarTypeStats($conn);
    }
}

function getDailyCarTypeStats($conn) {
    try {
        // Get today's date in Y-m-d format
        $today = date('Y-m-d');
        
        // Modified query to get car type statistics for today
        $query = "SELECT 
                    bt.`bodyType_name` as type,
                    COUNT(DISTINCT CASE 
                        WHEN r.`status` = 'ongoing' THEN r.`carID`
                        ELSE NULL
                    END) as count
                FROM `car_bodytype` bt
                LEFT JOIN `car_models` cm ON bt.`bodyType_id` = cm.`bodyType_id`
                LEFT JOIN `cars` c ON cm.`model_id` = c.`model_id`
                LEFT JOIN `reservation` r ON c.`car_id` = r.`carID` 
                    AND r.`status` = 'ongoing'
                    AND ? BETWEEN DATE(r.`start_date`) AND DATE(r.`end_date`)
                GROUP BY bt.`bodyType_name`
                ORDER BY count DESC";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param('s', $today);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        if (!$result) {
            throw new Exception("Get result failed: " . $stmt->error);
        }

        $stats = [];
        while ($row = $result->fetch_assoc()) {
            $stats[] = [
                'type' => $row['type'],
                'count' => (int)$row['count']
            ];
        }

        // If no results, return all car types with count 0
        if (empty($stats)) {
            $query = "SELECT DISTINCT bodyType_name as type, 0 as count 
                     FROM car_bodytype 
                     ORDER BY bodyType_name";
            $result = $conn->query($query);
            $stats = $result->fetch_all(MYSQLI_ASSOC);
        }

        return $stats;

    } catch (Exception $e) {
        // Log the error for debugging
        error_log("Error in getDailyCarTypeStats: " . $e->getMessage());
        // Return empty array instead of throwing to prevent 500 error
        return [];
    }
}

function getWeeklyCarTypeStats($conn) {
    // Add date condition for car type stats
    $dateCondition = getDateRangeCondition('weekly');
    
    $query = "SELECT 
                bt.`bodyType_name` as type,
                COUNT(*) as count
              FROM `cars` c
              JOIN `car_models` cm ON c.`model_id` = cm.`model_id`
              JOIN `car_bodytype` bt ON cm.`bodyType_id` = bt.`bodyType_id`
              JOIN `reservation` r ON r.`carID` = c.`car_id`
              JOIN `transaction` t ON t.`reservationID` = r.`id`
              WHERE t.`status` = 'Paid' AND {$dateCondition}
              GROUP BY bt.`bodyType_name`";
    
    $result = $conn->query($query);
    if (!$result) {
        throw new Exception("Error getting car stats: " . $conn->error . "\nQuery: " . $query);
    }

    $stats = [];
    while ($row = $result->fetch_assoc()) {
        $stats[] = [
            'type' => $row['type'],
            'count' => (int)$row['count']
        ];
    }
    
    return $stats;
}

function getMonthlyCarTypeStats($conn) {
    // Add date condition for car type stats
    $dateCondition = getDateRangeCondition('monthly');
    
    $query = "SELECT 
                bt.`bodyType_name` as type,
                COUNT(*) as count
              FROM `cars` c
              JOIN `car_models` cm ON c.`model_id` = cm.`model_id`
              JOIN `car_bodytype` bt ON cm.`bodyType_id` = bt.`bodyType_id`
              JOIN `reservation` r ON r.`carID` = c.`car_id`
              JOIN `transaction` t ON t.`reservationID` = r.`id`
              WHERE t.`status` = 'Paid' AND {$dateCondition}
              GROUP BY bt.`bodyType_name`";
    
    $result = $conn->query($query);
    if (!$result) {
        throw new Exception("Error getting car stats: " . $conn->error . "\nQuery: " . $query);
    }

    $stats = [];
    while ($row = $result->fetch_assoc()) {
        $stats[] = [
            'type' => $row['type'],
            'count' => (int)$row['count']
        ];
    }
    
    return $stats;
}

function getYearlyCarTypeStats($conn) {
    // Add date condition for car type stats
    $dateCondition = getDateRangeCondition('yearly');
    
    $query = "SELECT 
                bt.`bodyType_name` as type,
                COUNT(*) as count
              FROM `cars` c
              JOIN `car_models` cm ON c.`model_id` = cm.`model_id`
              JOIN `car_bodytype` bt ON cm.`bodyType_id` = bt.`bodyType_id`
              JOIN `reservation` r ON r.`carID` = c.`car_id`
              JOIN `transaction` t ON t.`reservationID` = r.`id`
              WHERE t.`status` = 'Paid' AND {$dateCondition}
              GROUP BY bt.`bodyType_name`";
    
    $result = $conn->query($query);
    if (!$result) {
        throw new Exception("Error getting car stats: " . $conn->error . "\nQuery: " . $query);
    }

    $stats = [];
    while ($row = $result->fetch_assoc()) {
        $stats[] = [
            'type' => $row['type'],
            'count' => (int)$row['count']
        ];
    }
    
    return $stats;
}
