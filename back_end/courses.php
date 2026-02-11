<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$sql = "
  SELECT
    CONCAT(cc.college_id, '-', cc.course_id) AS id,
    c.college_name AS title,
    CONCAT(crs.course_name, ' - ', c.affiliated_university) AS description,
    crs.course_name AS course,
    crs.course_level AS level,
    'Full-Time' AS mode,
    cc.exam_required AS exam,
    c.city AS location,
    c.ownership AS type,
    0 AS rating,
    COALESCE(cc.fees_max, cc.fees_min, 0) AS fees,
    COALESCE(cc.intake, 0) AS seats,
    0 AS placement,
    CASE
      WHEN c.hostel_available = 'Yes' THEN 'Hostel'
      ELSE ''
    END AS facilities,
    '' AS specializations,
    crs.course_name AS badge,
    0 AS score
  FROM college_courses cc
  JOIN colleges c ON c.college_id = cc.college_id
  JOIN courses crs ON crs.course_id = cc.course_id
";

try {
  $stmt = $pdo->query($sql);
  $rows = $stmt->fetchAll();
  echo json_encode(['courses' => $rows]);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Query failed.']);
}
