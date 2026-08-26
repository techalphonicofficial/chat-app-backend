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

    // OLD Map a user to a room
    mapUserToRoom: async (room_id, user_id, can_view_previous_messages = 1) => {
        const [result] = await db.execute(
            'INSERT INTO room_maps (room_id, user_id, can_view_previous_messages) VALUES (?, ?, ?)',
            [room_id, user_id, can_view_previous_messages]
        );
        return result.insertId;
    },

    //New with check for existing mapping and room name in error message
    // mapUserToRoom: async (room_id, user_id, can_view_previous_messages = 1) => {
    //     // Check if user is already mapped to this room (with room name)
    //     const [existing] = await db.execute(
    //         `SELECT rm.*, cr.room_name 
    //      FROM room_maps rm
    //      JOIN chat_rooms cr ON cr.id = rm.room_id
    //      WHERE rm.user_id = ? 
    //      LIMIT 1`,
    //         [user_id]
    //     );

    //     // 👇 User ka role DB se nikaalo
    //     const [userRows] = await db.execute(
    //         'SELECT role FROM users WHERE id = ? LIMIT 1',
    //         [user_id]
    //     );

    //     console.log('Existing mapping check:', existing);

    //     if (existing.length > 0 && userRows[0].role === "employee") {
    //         const roomName = existing[0].room_name || `Room #${existing[0].room_id}`;
    //         throw new Error(
    //             `User is already mapped to room "${roomName}"`
    //         );
    //     }

    //     // Create new mapping
    //     const [result] = await db.execute(
    //         'INSERT INTO room_maps (room_id, user_id, can_view_previous_messages) VALUES (?, ?, ?)',
    //         [room_id, user_id, can_view_previous_messages]
    //     );
    //     return result.insertId;
    // },

    updateRoomMapping: async (user_id, new_room_id, can_view_previous_messages = 1) => {

        // 👇 User ka role check karo
        const [userRows] = await db.execute(
            'SELECT role FROM users WHERE id = ? LIMIT 1',
            [user_id]
        );

        if (userRows.length === 0) {
            throw new Error('User not found');
        }

        const role = userRows[0].role;

        if (role === 'admin') {
            throw new Error('Admin does not use single-room mapping. Use mapUserToRoom instead.');
        }

        // 👇 Check karo ki existing mapping hai bhi ya nahi
        const [existing] = await db.execute(
            'SELECT * FROM room_maps WHERE user_id = ? LIMIT 1',
            [user_id]
        );
        if (existing.length === 0) {
            throw new Error('No existing room mapping found for this user. Use mapUserToRoom to create one.');
        }

        // 👇 Existing row ko update karo (delete+insert nahi, direct UPDATE)
        await db.execute(
            'UPDATE room_maps SET room_id = ?, can_view_previous_messages = ? WHERE user_id = ?',
            [new_room_id, can_view_previous_messages, user_id]
        );

        return { user_id, old_room_id: existing[0].room_id, new_room_id };
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
