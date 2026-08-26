const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('--- Database:', process.env.DB_NAME, '---');
        const [tables] = await connection.execute('SHOW TABLES;');
        console.log('Tables in database:');
        tables.forEach(t => console.log(' -', Object.values(t)[0]));
        
        console.log('\n--- Schema for "users" ---');
        try {
            const [userSchema] = await connection.execute('SHOW CREATE TABLE users;');
            console.log(userSchema[0]['Create Table']);
        } catch (e) {
            console.log('Users table does not exist or error:', e.message);
        }

        console.log('\n--- Schema for "messages" ---');
        try {
            const [msgSchema] = await connection.execute('SHOW CREATE TABLE messages;');
            console.log(msgSchema[0]['Create Table']);
        } catch (e) {
            console.log('Messages table does not exist or error:', e.message);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkTables();
