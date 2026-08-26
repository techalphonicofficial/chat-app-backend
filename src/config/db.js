require('dotenv').config({ path: '/home/yber.in/public_html/src/.env' });




const mysql = require('mysql2');


require('dotenv').config();



const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to MySQL database:', process.env.DB_NAME);
        connection.release();
    }
});

module.exports = promisePool;

