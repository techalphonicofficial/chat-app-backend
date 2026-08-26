const Room = require('../models/roomModel');

exports.createRoom = async (req, res) => {
    try {
        const { room_name, room_type } = req.body;
        if (!room_name) {
            return res.status(400).json({ error: 'room_name is required' });
        }

        let room_logo = null;
        if (req.file) {
            room_logo = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        const roomId = await Room.createRoom(room_name, room_type || 'group', room_logo);
        res.status(201).json({
            message: 'Room created successfully',
            room_id: roomId,
            room_logo: room_logo
        });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.listRooms = async (req, res) => {
    try {
        const { id: user_id, role } = req.user;
        let rooms;

        if (role === 'admin') {
            // Admin sees all rooms
            rooms = await Room.getAllRooms();
        } else {
            // Employees see only assigned rooms
            rooms = await Room.getUserRooms(user_id);
        }

        res.status(200).json(rooms);
    } catch (error) {
        console.error('Error listing rooms:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.mapUserToRoom = async (req, res) => {
    try {
        const { room_id, user_id, can_view_previous_messages } = req.body;
        if (!room_id || !user_id) {
            return res.status(400).json({ error: 'room_id and user_id are required' });
        }
        // can_view_previous_messages will default to 1 in model if not provided
        await Room.mapUserToRoom(room_id, user_id, can_view_previous_messages);
        res.status(201).json({
            message: 'User mapped to room successfully'
        });
    } catch (error) {
        console.error('Error mapping user to room:', error);

        // Real DB-level duplicate key violation
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'User is already in this room' });
        }

        // App-level check thrown from Room.mapUserToRoom (existing.length > 0)
        if (error.message && error.message.includes('already mapped')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateRoomMapping = async (req, res) => {
    try {
        const { room_id, user_id, can_view_previous_messages } = req.body;
        if (!room_id || !user_id) {
            return res.status(400).json({ error: 'room_id and user_id are required' });
        }

        const success = await Room.updateMapping(room_id, user_id, can_view_previous_messages);

        if (!success) {
            return res.status(404).json({ error: 'Mapping not found' });
        }

        // ARCHIVING LOGIC: If visibility is disabled, move messages to history
        if (parseInt(can_view_previous_messages) === 0) {
            await Room.archiveRoomMessages(room_id, user_id);
        }

        res.status(200).json({
            message: 'Room mapping updated successfully',
            archived: parseInt(can_view_previous_messages) === 0
        });
    } catch (error) {
        console.error('Error updating room mapping:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
