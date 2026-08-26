const Message = require('../models/messageModel');

const { sendMessageService } = require('../services/messageService');
const { setUserOnline, setUserOffline } = require('../models/userModel');


// ─── Console Colors ────────────────────────────────────────────

const C = {

    reset: '\x1b[0m',

    green: '\x1b[32m',

    yellow: '\x1b[33m',

    cyan: '\x1b[36m',

    red: '\x1b[31m',

    blue: '\x1b[34m',

    magenta: '\x1b[35m',

    gray: '\x1b[90m',

    bold: '\x1b[1m',

};



const timestamp = () => {

    const now = new Date();

    return C.gray + `[${now.toLocaleTimeString('en-IN', { hour12: true })}]` + C.reset;

};



const log = {

    connect: (msg) => console.log(`${timestamp()} ${C.green}${C.bold}✔ CONNECT   ${C.reset}${C.green}${msg}${C.reset}`),

    join: (msg) => console.log(`${timestamp()} ${C.cyan}${C.bold}🚪 JOIN ROOM ${C.reset}${C.cyan}${msg}${C.reset}`),

    send: (msg) => console.log(`${timestamp()} ${C.blue}${C.bold}📤 SENT      ${C.reset}${C.blue}${msg}${C.reset}`),

    receive: (msg) => console.log(`${timestamp()} ${C.magenta}${C.bold}📩 RECEIVED  ${C.reset}${C.magenta}${msg}${C.reset}`),

    typing: (msg) => console.log(`${timestamp()} ${C.yellow}${C.bold}✏  TYPING    ${C.reset}${C.yellow}${msg}${C.reset}`),

    disconnect: (msg) => console.log(`${timestamp()} ${C.red}${C.bold}✖ DISCONNECT${C.reset}${C.red}${msg}${C.reset}`),

    error: (msg) => console.error(`${timestamp()} ${C.red}${C.bold}⚠ ERROR     ${C.reset}${C.red}${msg}${C.reset}`),

    status: (msg) => console.log(`${timestamp()} ${C.yellow}✔ STATUS     ${C.reset}${C.yellow}${msg}${C.reset}`),

};



// ─── Socket Handler ────────────────────────────────────────────

module.exports = (io) => {

    io.on('connection', (socket) => {

        log.connect(`Socket ID: ${socket.id}`);
        // Decoded user print (agar middleware ne verify kar diya to ye milega)
        const userId = socket.user?.id;
        if (userId) {
            setUserOnline(userId)
                .then(() => {
                    console.log(`${timestamp()} ${C.green}${C.bold}👤 ONLINE     ${C.reset}${C.green}User ID: ${userId}${C.reset}`);
                })
                .catch(err => log.error(`Set Online Error: ${err.message}`));
        }
        // ── User joins a room ──────────────────────────────────

        socket.on('join_room', async (room_id) => {

            try {

                socket.join(room_id);

                log.join(`Socket ${socket.id} joined Room: ${room_id}`);



                // Fetch existing messages from DB

                const messages = await Message.findByRoom(room_id);

                socket.emit('load_messages', messages);

            } catch (err) {

                log.error(`Join Room Error: ${err.message}`);

            }

        });



        // 1️⃣ Send Message

        socket.on('send_message', async (data) => {


            try {

                log.send(`Room: ${data.room_id} | From: ${data.sender_id} | Msg: "${data.message}"`);



                // Save to DB and broadcast via Service

                await sendMessageService(io, data);

            } catch (err) {

                log.error(`Send Message Error: ${err.message}`);

            }

        });



        // 2️⃣ Delivered Tick

        socket.on('message_delivered', async ({ message_id, room_id }) => {

            try {

                log.status(`Message ${message_id} delivered in Room: ${room_id}`);



                // Update DB status to 'delivered'

                await Message.updateStatus(message_id, 'delivered');



                io.to(room_id).emit("message_status_update", {

                    message_id,

                    status: "delivered"

                });

            } catch (err) {

                log.error(`Delivered Status Error: ${err.message}`);

            }

        });



        // 3️⃣ Read Tick

        socket.on('messages_read', async ({ room_id, user_id }) => {

            try {

                log.status(`Messages in Room ${room_id} read by User: ${user_id}`);



                // Update DB: Mark messages as read for this user

                await Message.markRoomRead(room_id, user_id);



                io.to(room_id).emit("message_status_update", {

                    room_id,

                    status: "read"

                });

            } catch (err) {

                log.error(`Read Status Error: ${err.message}`);

            }

        });



        // ── Typing indicator ──────────────────────────────────

        socket.on('typing', (data) => {

            const { room_id, user_id, isTyping } = data;

            socket.to(room_id).emit('display_typing', { user_id, isTyping });

        });



        // ── Disconnect ────────────────────────────────────────
        socket.on('disconnect', () => {

            log.disconnect(`Socket ID: ${socket.id}`);

            // 👇 User details log karo
            const userId = socket.user?.id;

            if (userId) {
                setUserOffline(userId)
                    .then(() => {
                        console.log(`${timestamp()} ${C.red}${C.bold}👤 OFFLINE    ${C.reset}${C.red}User ID: ${userId} | Last seen updated${C.reset}`);
                    })
                    .catch(err => log.error(`Set Offline Error: ${err.message}`));
            }
        });

    });

};

