const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const app = require('./app');
const messageController = require('./controllers/messageController');
const { createCorsOptions, getAllowedOrigins } = require('./config/corsOptions');
const socketAuthMiddleware = require('./sockets/socketAuthMiddleware'); // 👈 ADD

const server = http.createServer(app);

const io = new Server(server, {
    cors: createCorsOptions({ methods: ["GET", "POST"] }),
    transports: ["websocket", "polling"]
});

// 👇 ADD — chatSocket require hone se pehle
io.use(socketAuthMiddleware);

// Initialize Socket logic
require('./sockets/chatSocket')(io);

// Pass socket instance to controllers
messageController.setSocketInstance(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    const allowedOrigins = getAllowedOrigins();
    console.log(`Server is running on:`);
    console.log(`- Local:   http://localhost:${PORT}`);
    console.log(`- Port:    ${PORT}`);
    console.log(`- CORS:    ${allowedOrigins.length ? allowedOrigins.join(', ') : 'all origins'}`);
});

