const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: Send a message via API (Authed, supports file upload)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               room_id:
 *                 type: string
 *               receiver_id:
 *                 type: integer
 *               message:
 *                 type: string
 *               message_type:
 *                 type: string
 *                 enum: [text, image, document]
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/send', authMiddleware, upload.single('file'), messageController.sendMessageAPI);

/**
 * @swagger
 * /api/messages/history/{room_id}:
 *   get:
 *     summary: Retrieve message history (Includes archived chats if visibility enabled)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: room_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID or Private Room Code
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/history/:room_id', authMiddleware, messageController.getMessageHistory);

/**
 * @swagger
 * /api/messages/chat-with/{other_user_id}:
 *   get:
 *     summary: Get chat history with a specific user (WhatsApp Style)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: other_user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user you want to chat with
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: List of messages (Active + Archived)
 */
router.get('/chat-with/:other_user_id', authMiddleware, messageController.getChatWithUser);

/**
 * @swagger
 * /api/messages/recent:
 *   get:
 *     summary: Retrieve list of recent conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent chats
 */
router.get('/recent', authMiddleware, messageController.getRecentChats);

/**
 * @swagger
 * /api/messages/mark-read:
 *   post:
 *     summary: Mark all messages in a room as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               room_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.post('/mark-read', authMiddleware, messageController.markReadAPI);

module.exports = router;
