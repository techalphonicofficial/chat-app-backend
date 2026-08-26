const db = require('../config/db');

const setUserOnline = async (userId) => {
    await db.execute(
        'UPDATE users SET is_online = TRUE WHERE id = ?',
        [userId]
    );
};

const setUserOffline = async (userId) => {
    await db.execute(
        'UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE id = ?',
        [userId]
    );
};

module.exports = { setUserOnline, setUserOffline };