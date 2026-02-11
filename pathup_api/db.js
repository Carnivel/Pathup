const mysql = require('mysql2');
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',   // put your MySQL password if any
  database: 'pathup'
});

module.exports = db;
