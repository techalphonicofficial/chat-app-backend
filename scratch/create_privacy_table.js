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
        console.log('Creating user_privacy_settings table...');
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_privacy_settings (
                user_id BIGINT(20) PRIMARY KEY,
                can_view_previous_messages TINYINT(1) DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);

        // Initialize settings for existing users
        await connection.execute(`
            INSERT IGNORE INTO user_privacy_settings (user_id, can_view_previous_messages)
            SELECT id, 1 FROM users;
        `);
        
        console.log('Table created successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
