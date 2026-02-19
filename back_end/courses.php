<?php
require 'db.php';

// Fetch all courses for dropdown
$courseStmt = $pdo->query("SELECT * FROM courses");
$courses = $courseStmt->fetchAll();

// Check if filter selected
$selectedCourse = $_GET['course'] ?? '';

$sql = "SELECT c.college_name, c.city, co.course_name, cc.fees_min
        FROM college_courses cc
        JOIN colleges c ON cc.college_id = c.college_id
        JOIN courses co ON cc.course_id = co.course_id";

if ($selectedCourse) {
    $sql .= " WHERE co.course_id = :course_id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['course_id' => $selectedCourse]);
} else {
    $stmt = $pdo->query($sql);
}

$results = $stmt->fetchAll();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Colleges - PathUp</title>
</head>
<body>

<h2>Filter by Course</h2>

<form method="GET">
    <select name="course">
        <option value="">All Courses</option>
        <?php foreach ($courses as $course): ?>
            <option value="<?= $course['course_id'] ?>"
                <?= $selectedCourse == $course['course_id'] ? 'selected' : '' ?>>
                <?= htmlspecialchars($course['course_name']) ?>
            </option>
        <?php endforeach; ?>
    </select>
    <button type="submit">Filter</button>
</form>

<hr>

<h2>College List</h2>

<table border="1" cellpadding="10">
    <tr>
        <th>College Name</th>
        <th>City</th>
        <th>Course</th>
        <th>Fees (Min)</th>
    </tr>

    <?php foreach ($results as $row): ?>
        <tr>
            <td><?= htmlspecialchars($row['college_name']) ?></td>
            <td><?= htmlspecialchars($row['city']) ?></td>
            <td><?= htmlspecialchars($row['course_name']) ?></td>
            <td><?= htmlspecialchars($row['fees_min']) ?></td>
        </tr>
    <?php endforeach; ?>

</table>

</body>
</html>
