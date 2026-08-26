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
        console.log('Creating history tables...');
        
        // 1. User History Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_record_id BIGINT(20) NOT NULL,
                name VARCHAR(100),
                custom_user_id VARCHAR(50),
                mobile_number VARCHAR(20),
                profile_image VARCHAR(255),
                role ENUM('admin', 'employee'),
                passkey_hash VARCHAR(255),
                archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Message History Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS message_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                original_msg_id BIGINT(20),
                room_id BIGINT(20),
                sender_id BIGINT(20),
                receiver_id BIGINT(20),
                message TEXT,
                message_type VARCHAR(20),
                file_url VARCHAR(255),
                status VARCHAR(20),
                created_at TIMESTAMP,
                archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
