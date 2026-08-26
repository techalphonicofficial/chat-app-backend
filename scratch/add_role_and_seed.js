const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateAndSeed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Adding role column to users...');
        
        await connection.execute(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS role ENUM('admin', 'employee') DEFAULT 'employee';
        `);
        
        console.log('Seeding admin user...');
        
        const admin_user_id = 'admin';
        const admin_passkey = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const passkey_hash = await bcrypt.hash(admin_passkey, salt);

        // Check if admin already exists
        const [existing] = await connection.execute('SELECT id FROM users WHERE user_id = ?', [admin_user_id]);
        
        if (existing.length === 0) {
            await connection.execute(
                'INSERT INTO users (user_id, passkey_hash, role, name) VALUES (?, ?, "admin", "Administrator")',
                [admin_user_id, passkey_hash]
            );
            console.log('Admin user seeded successfully!');
            console.log('User ID: admin');
            console.log('Passkey: admin123');
        } else {
            console.log('Admin user already exists.');
        }

        console.log('Migration and seeding successful!');
    } catch (error) {
        console.error('Migration/Seeding failed:', error);
    } finally {
        await connection.end();
    }
}

migrateAndSeed();
