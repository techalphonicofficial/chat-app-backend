
const db = require('../src/config/db');

async function updateDB() {
    try {
        console.log('Updating messages table...');
        await db.execute(`
            ALTER TABLE messages 
            ADD COLUMN IF NOT EXISTS status ENUM('sent','delivered','read') DEFAULT 'sent'
        `);
        console.log('Database updated successfully.');
    } catch (err) {
        // MySQL doesn't support IF NOT EXISTS for ADD COLUMN in most versions, so we catch duplicate column error
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Column status already exists.');
        } else {
             // Try without IF NOT EXISTS if syntax error
             try {
                 await db.execute("ALTER TABLE messages ADD COLUMN status ENUM('sent','delivered','read') DEFAULT 'sent'");
                 console.log('Database updated successfully.');
             } catch (e) {
                 if (e.code === 'ER_DUP_COLUMN_NAME') {
                     console.log('Column status already exists.');
                 } else {
                     console.error('Error updating database:', e.message);
                 }
             }
        }
    } finally {
        process.exit();
    }
}

updateDB();
