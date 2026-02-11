const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('PathUp API is running');
});

app.get('/api/colleges', (req, res) => {
  db.query(
    'SELECT college_id, college_name, city FROM colleges',
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
app.get('/api/colleges/search', (req, res) => {
  const { course, city, maxFee, hostel, ownership } = req.query;

  let sql = `
    SELECT DISTINCT
      c.college_id,
      c.college_name,
      c.city,
      c.ownership,
      co.course_name,
      cc.fees_min,
      cc.fees_max
    FROM colleges c
    JOIN college_courses cc ON c.college_id = cc.college_id
    JOIN courses co ON cc.course_id = co.course_id
    WHERE 1 = 1
  `;

  const params = [];

  if (course) {
    sql += ` AND co.course_name = ?`;
    params.push(course);
  }

  if (city) {
    sql += ` AND c.city = ?`;
    params.push(city);
  }

  if (maxFee) {
    sql += ` AND cc.fees_max <= ?`;
    params.push(maxFee);
  }

  if (hostel) {
    sql += ` AND c.hostel_available = ?`;
    params.push(hostel);
  }

  if (ownership) {
    sql += ` AND c.ownership = ?`;
    params.push(ownership);
  }

  sql += ` ORDER BY cc.fees_min ASC`;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});
