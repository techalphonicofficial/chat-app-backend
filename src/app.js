const express = require('express');
const cors = require('cors');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const { swaggerUi, specs } = require('./config/swagger');
const { createCorsOptions } = require('./config/corsOptions');

const app = express();

app.set('trust proxy', true);

app.use(cors(createCorsOptions()));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Swagger Documentation
app.get('/api-docs.json', (req, res) => {
    res.json(specs);
});

const db = require('./config/db'); // adjust path
app.get('/db-check', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users');

        res.status(200).json({
            success: true,
            database: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            database: false,
            error: error.message
        });
    }
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API Routes
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('Chat Server is running...');
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'chat-server'
    });
});

// WebSocket Testing Route
app.get('/test-socket', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>WebSocket Test</title>
            <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f4f7f6; }
                h1 { color: #333; }
                #status { font-size: 2.5em; font-weight: bold; color: orange; margin-top: 20px; }
                .box { border: 1px solid #ddd; padding: 40px; display: inline-block; background: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                #details { color: #666; margin-top: 15px; font-size: 1.1em; }
            </style>
        </head>
        <body>
            <div class="box">
                <h1>WebSocket Connection Test</h1>
                <div id="status">Connecting...</div>
                <p id="details">Please wait while we try to connect to /socket.io/...</p>
            </div>
            
            <script>
                // Connect to the same domain this page is loaded from
                const socket = io({
                    transports: ['websocket'],
                    upgrade: false
                });

                socket.on('connect', () => {
                    const statusEl = document.getElementById('status');
                    statusEl.innerText = 'YES (Connected)';
                    statusEl.style.color = '#28a745';
                    document.getElementById('details').innerText =
                        'Connected with ' + socket.io.engine.transport.name + '. Socket ID: ' + socket.id;
                });

                socket.on('connect_error', (error) => {
                    const statusEl = document.getElementById('status');
                    statusEl.innerText = 'NO (Connection Failed)';
                    statusEl.style.color = '#dc3545';
                    document.getElementById('details').innerText = 'Error: ' + error.message;
                    console.error("Socket Connection Error:", error);
                });

                socket.on('disconnect', () => {
                    const statusEl = document.getElementById('status');
                    statusEl.innerText = 'Disconnected';
                    statusEl.style.color = '#fd7e14';
                    document.getElementById('details').innerText = 'The connection was lost.';
                });
            </script>
        </body>
        </html>
    `);
});

module.exports = app;
