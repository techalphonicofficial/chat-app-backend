const db = require('../config/db');

const Room = {
    // Find a 1v1 room between two users
    findPrivateRoom: async (user1_id, user2_id) => {
        const room_code = [user1_id, user2_id].sort((a, b) => a - b).join('_');
        const [rooms] = await db.execute(
            'SELECT * FROM chat_rooms WHERE room_code = ?',
            [room_code]
        );
        return rooms[0];
    },

    // Create a new 1v1 room
    createPrivateRoom: async (user1_id, user2_id) => {
        const room_code = [user1_id, user2_id].sort((a, b) => a - b).join('_');

        // Use a transaction to ensure room and participants are created together
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [roomResult] = await connection.execute(
                'INSERT INTO chat_rooms (room_code, room_type) VALUES (?, "private")',
                [room_code]
            );
            const room_id = roomResult.insertId;

            await connection.execute(
                'INSERT INTO room_participants (room_id, user_id) VALUES (?, ?), (?, ?)',
                [room_id, user1_id, room_id, user2_id]
            );

            await connection.commit();
            return room_id;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Verify if a user is in a room
    isParticipant: async (room_id, user_id) => {
        const [rows] = await db.execute(
            'SELECT id, can_view_previous_messages, joined_at FROM room_maps WHERE room_id = ? AND user_id = ?',
            [room_id, user_id]
        );

        return rows[0] || null;
    },

    // Create a general room (e.g. group)
    createRoom: async (room_name, room_type = 'group', room_logo = null) => {
        const [result] = await db.execute(
            'INSERT INTO chat_rooms (room_name, room_type, room_logo) VALUES (?, ?, ?)',
            [room_name, room_type, room_logo]
        );
        return result.insertId;
    },

    // Map a user to a room
    mapUserToRoom: async (room_id, user_id, can_view_previous_messages = 1) => {
        const [result] = await db.execute(
            'INSERT INTO room_maps (room_id, user_id, can_view_previous_messages) VALUES (?, ?, ?)',
            [room_id, user_id, can_view_previous_messages]
        );
        return result.insertId;
    },

    // Get all participants in a room (from room_maps)
    getParticipants: async (room_id) => {
        const [rows] = await db.execute(
            'SELECT user_id FROM room_maps WHERE room_id = ?',
            [room_id]
        );
        return rows.map(r => r.user_id);
    },

    // List all rooms
    getAllRooms: async () => {
        const [rows] = await db.execute('SELECT * FROM chat_rooms ORDER BY created_at DESC');
        return rows;
    },

    // Get rooms assigned to a specific user
    getUserRooms: async (user_id) => {
        const [rows] = await db.execute(
            `SELECT cr.* FROM chat_rooms cr
             JOIN room_maps rm ON cr.id = rm.room_id
             WHERE rm.user_id = ?
             ORDER BY cr.created_at DESC`,
            [user_id]
        );
        return rows;
    },

    // Global Archive: Move ALL messages of a user to history
    archiveUserAllMessages: async (user_id) => {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            await connection.execute(
                `INSERT INTO message_history (original_msg_id, room_id, sender_id, receiver_id, message, message_type, file_url, status, created_at)
                 SELECT id, room_id, sender_id, receiver_id, message, message_type, file_url, status, created_at
                 FROM messages
                 WHERE sender_id = ? OR receiver_id = ?`,
                [user_id, user_id]
            );
            await connection.execute(
                `DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?`,
                [user_id, user_id]
            );
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Global Restore: Move ALL messages of a user back to active
    restoreUserAllMessages: async (user_id) => {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            await connection.execute(
                `INSERT INTO messages (id, room_id, sender_id, receiver_id, message, message_type, file_url, status, created_at)
                 SELECT original_msg_id, room_id, sender_id, receiver_id, message, message_type, file_url, status, created_at
                 FROM message_history
                 WHERE sender_id = ? OR receiver_id = ?`,
                [user_id, user_id]
            );
            await connection.execute(
                `DELETE FROM message_history WHERE sender_id = ? OR receiver_id = ?`,
                [user_id, user_id]
            );
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = Room;
