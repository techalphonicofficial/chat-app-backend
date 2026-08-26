const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkAllTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        const [tables] = await connection.execute('SHOW TABLES;');
        for (const t of tables) {
            const tableName = Object.values(t)[0];
            console.log(`\n--- Schema for "${tableName}" ---`);
            const [schema] = await connection.execute(`SHOW CREATE TABLE ${tableName};`);
            console.log(schema[0]['Create Table']);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkAllTables();
