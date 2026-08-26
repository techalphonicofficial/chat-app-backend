const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: List all rooms
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rooms
 */
router.get('/', authMiddleware, roomController.listRooms);

/**
 * @swagger
 * /api/rooms/create:
 *   post:
 *     summary: Create a new chat room with logo support
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               room_name:
 *                 type: string
 *               room_type:
 *                 type: string
 *                 enum: [group, private]
 *               room_logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Room created successfully
 */
router.post('/create', authMiddleware, upload.single('room_logo'), roomController.createRoom);

/**
 * @swagger
 * /api/rooms/map:
 *   post:
 *     summary: Map a user to a room
 *     tags: [Rooms]
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
 *                 type: integer
 *               user_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User mapped to room successfully
 */
router.post('/map', authMiddleware, roomController.mapUserToRoom);

/**
 * @swagger
 * /api/rooms/map:
 *   put:
 *     summary: Update user room mapping (e.g. toggle old chat visibility)
 *     tags: [Rooms]
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
 *                 type: integer
 *               user_id:
 *                 type: integer
 *               can_view_previous_messages:
 *                 type: integer
 *                 enum: [0, 1]
 *     responses:
 *       200:
 *         description: Mapping updated successfully
 */
router.put('/map', authMiddleware, roomController.updateRoomMapping);

module.exports = router;
