const { sendMessageService } = require('../services/messageService');
const Message = require('../models/messageModel');
const Room = require('../models/roomModel');
const db = require('../config/db');

let ioInstance;

exports.setSocketInstance = (io) => {
    ioInstance = io;
};

// Swagger / API se message send
exports.sendMessageAPI = async (req, res) => {
    try {
        let { room_id, receiver_id, message, message_type, file_url } = req.body;
        const sender_id = req.user.id;
        const sender_role = req.user.role;

        // If a file is uploaded, set the file_url and type
        if (req.file) {
            file_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            if (!message_type || message_type === 'text') {
                message_type = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
            }
        }

        const msg = await sendMessageService(ioInstance, {
            room_id,
            sender_id,
            receiver_id,
            message,
            message_type: message_type || 'text',
            file_url
        }, sender_role);
        res.status(201).json(msg);
    } catch (err) {
        console.error('Error in sendMessageAPI:', err);
        if (err.message === 'Only Admin can initiate a new chat.') {
            return res.status(403).json({ error: err.message });
        }
        res.status(500).json({ error: "Failed to send message" });
    }

};

// mark read API
exports.markReadAPI = async (req, res) => {
    try {
        const { room_id } = req.body;
        const user_id = req.user.id; // Current logged in user
        await Message.markRoomRead(room_id, user_id);

        if (ioInstance) {
            ioInstance.to(room_id).emit("message_status_update", { room_id, status: "read" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error in markReadAPI:', err);
        res.status(500).json({ error: "Failed to mark as read" });
    }
};

exports.getMessageHistory = async (req, res) => {
    const { room_id } = req.params;
    const user_id = req.user.id;
    try {
        // Verify membership and check visibility setting
        const mapping = await Room.isParticipant(room_id, user_id);
        
        if (!mapping && !room_id.includes('_')) {
            return res.status(403).json({ error: "Access denied. You are not a member of this room." });
        }

        // If mapping exists, use its can_view_previous_messages value, otherwise default to true for private chats
        const include_history = mapping ? !!mapping.can_view_previous_messages : true;

        const messages = await Message.findByRoom(room_id, user_id, include_history);
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



exports.getRecentChats = async (req, res) => {
    try {
        const user_id = req.user.id; // From Auth Token
        const chats = await Message.getChatList(user_id);
        res.status(200).json(chats);
    } catch (error) {
        console.error('Error fetching chat list:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// NEW: WhatsApp style chat history by User ID (with Pagination)
exports.getChatWithUser = async (req, res) => {
  

    const { other_user_id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const me_id = req.user.id;

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // 1. Check if history is enabled for the LOGGED-IN user (Global)
        const [statusRows] = await db.execute(
            "SELECT can_view_previous_messages FROM user_privacy_settings WHERE user_id = ? LIMIT 1",
            [me_id]
        );

        // Default to true if no mapping exists, otherwise use the database value
        let include_history = true;
        if (statusRows.length > 0) {
            include_history = statusRows[0].can_view_previous_messages === 1;
        }

        // 2. Fetch messages with dynamic history flag
        const messages = await Message.findPrivateChat(me_id, other_user_id, include_history, limit, offset);
        
        res.status(200).json({
            status: true,
            page: parseInt(page),
            limit: parseInt(limit),
            other_user_id,
            messages
        });
    } catch (error) {
        console.error('Error fetching private chat:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
