const router = require("express").Router();

const authController = require("../controllers/authController");

const upload = require("../middleware/uploadMiddleware");



/**

 * @swagger

 * /api/auth/check-user:

 *   post:

 *     summary: Check if a user exists by their custom user_id

 *     tags: [Auth]

 *     requestBody:

 *       required: true

 *       content:

 *         application/json:

 *           schema:

 *             type: object

 *             properties:

 *               user_id:

 *                 type: string

 *     responses:

 *       200:

 *         description: User status

 */

router.post("/check-user", authController.checkUser);



/**

 * @swagger

 * /api/auth/register:

 *   post:

 *     summary: Register a new user with profile image support

 *     tags: [Auth]

 *     requestBody:

 *       required: true

 *       content:

 *         multipart/form-data:

 *           schema:

 *             type: object

 *             properties:

 *               user_id:

 *                 type: string

 *               name:

 *                 type: string

 *               passkey:

 *                 type: string

 *               role:

 *                 type: string

 *                 enum: [admin, employee]

 *               profile_image:

 *                 type: string

 *                 format: binary

 *     responses:

 *       200:

 *         description: User registered successfully

 */

router.post("/register", upload.single('profile_image'), authController.register);



/**

 * @swagger

 * /api/auth/login:

 *   post:

 *     summary: Login with user_id and passkey

 *     tags: [Auth]

 *     requestBody:

 *       required: true

 *       content:

 *         application/json:

 *           schema:

 *             type: object

 *             properties:

 *               user_id:

 *                 type: string

 *               passkey:

 *                 type: string

 *     responses:

 *       200:

 *         description: Login successful, returns token

 */

router.post("/login", authController.login);



const authMiddleware = require("../middleware/authMiddleware");



/**

 * @swagger

 * /api/auth/users:

 *   get:

 *     summary: List all users (Authed)

 *     tags: [Auth]

 *     security:

 *       - bearerAuth: []

 *     parameters:

 *       - in: query

 *         name: room_id

 *         schema:

 *           type: string

 *         description: Optional room_id to filter users by room membership

 *     responses:

 *       200:

 *         description: List of users with last message details

 *         content:

 *           application/json:

 *             schema:

 *               type: object

 *               properties:

 *                 status:

 *                   type: boolean

 *                 users:

 *                   type: array

 *                   items:

 *                     type: object

 *                     properties:

 *                       id:

 *                         type: integer

 *                       user_id:

 *                         type: string

 *                       name:

 *                         type: string

 *                       last_message:

 *                         type: string

 *                       last_message_status:

 *                         type: string

 */

router.get("/users", authMiddleware, authController.listUsers);



/**

 * @swagger

 * /api/auth/all-users:

 *   get:

 *     summary: List all users with isolation (Admin sees all, Employee sees room colleagues)

 *     tags: [Auth]

 *     security:

 *       - bearerAuth: []

 *     responses:

 *       200:

 *         description: List of filtered users

 */

router.get("/all-users", authMiddleware, authController.getAllUsers);



/**

 * @swagger

 * /api/auth/users/{id}:

 *   put:

 *     summary: Update user details and archive old data in history

 *     tags: [Auth]

 *     security:

 *       - bearerAuth: []

 *     parameters:

 *       - in: path

 *         name: id

 *         required: true

 *         schema:

 *           type: integer

 *     requestBody:

 *       content:

 *         application/json:

 *           schema:

 *             type: object

 *             properties:

 *               name:

 *                 type: string

 *               user_id:

 *                 type: string

 *               mobile_number:

 *                 type: string

 *               profile_image:

 *                 type: string

 *               passkey:

 *                 type: string

 *               role:

 *                 type: string

 *                 enum: [admin, employee]

 *               can_view_previous_messages:

 *                 type: integer

 *                 enum: [0, 1]

 *                 description: 0 to Archive ALL chats, 1 to Restore ALL chats

 *     responses:

 *       200:

 *         description: User updated successfully, old record saved to user_history and chats archived/restored if requested

 */

router.put("/users/:id", authMiddleware, authController.updateUser);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   delete:
 *     summary: Delete a user and archive their data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.delete("/users/:id", authMiddleware, authController.deleteUser);

module.exports = router;

