const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('Altering messages table...');
        await connection.execute('ALTER TABLE messages MODIFY room_id VARCHAR(255) NOT NULL;');
        console.log('Successfully changed room_id to VARCHAR(255)');
    } catch (error) {
        console.error('Error fixing schema:', error);
    } finally {
        await connection.end();
    }
}

fixSchema();
