const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixMessagesTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('Dropping foreign key messages_ibfk_1...');
        try {
            await connection.execute('ALTER TABLE messages DROP FOREIGN KEY messages_ibfk_1;');
            console.log('Dropped foreign key messages_ibfk_1');
        } catch (e) {
            console.log('Foreign key might not exist or already dropped:', e.message);
        }

        console.log('Modifying room_id to VARCHAR(255)...');
        await connection.execute('ALTER TABLE messages MODIFY room_id VARCHAR(255) NOT NULL;');
        console.log('Successfully changed room_id to VARCHAR(255)');

        // Also let's check other columns to be safe
        console.log('Modifying sender_id and receiver_id to INT to match common patterns if needed...');
        // (Optional: depending on user needs, but usually IDs are INT/BIGINT)
        
    } catch (error) {
        console.error('Error fixing table:', error);
    } finally {
        await connection.end();
    }
}

fixMessagesTable();
