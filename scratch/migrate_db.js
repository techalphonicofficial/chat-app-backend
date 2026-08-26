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
        console.log('Migrating users table...');
        
        // Add user_id if it doesn't exist
        await connection.execute(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) UNIQUE AFTER id,
            ADD COLUMN IF NOT EXISTS passkey_hash VARCHAR(255) AFTER passkey;
        `);
        
        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
