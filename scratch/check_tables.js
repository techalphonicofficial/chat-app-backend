const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        const [users] = await connection.execute('DESCRIBE users');
        console.log('Users table:', users);
        
        const [rooms] = await connection.execute('DESCRIBE chat_rooms');
        console.log('Chat Rooms table:', rooms);
        
        const [participants] = await connection.execute('DESCRIBE room_participants');
        console.log('Room Participants table:', participants);
    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await connection.end();
    }
}

check();
