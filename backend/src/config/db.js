const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones: reutiliza conexiones en vez de abrir una nueva
// por cada consulta, lo que mejora el rendimiento de la aplicación.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tienda_online',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
