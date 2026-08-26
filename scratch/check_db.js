const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        const [tables] = await connection.execute('SHOW TABLES;');
        console.log('Tables:', tables);
        
        const [schema] = await connection.execute('SHOW CREATE TABLE messages;');
        console.log('Messages Schema:', schema[0]['Create Table']);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkTables();
