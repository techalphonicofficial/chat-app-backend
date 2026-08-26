const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Adding room_code and room_type to chat_rooms...');
        
        await connection.execute(`
            ALTER TABLE chat_rooms 
            ADD COLUMN IF NOT EXISTS room_code VARCHAR(100) UNIQUE AFTER id,
            ADD COLUMN IF NOT EXISTS room_type ENUM('private', 'group') DEFAULT 'private' AFTER room_code;
        `);
        
        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
