// src/test.js
const { io } = require("socket.io-client");
const readline = require("readline");

// 👇 apna asli JWT token yaha daalo (login/register API se milega)
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDcsInJvbGUiOiJlbXBsb3llZSIsImlhdCI6MTc4NzcyMDg0NCwiZXhwIjoxNzg4MzI1NjQ0fQ.sebMbgdQWSaWanRn46iAjFbJnawXVrxPEeRjVt8Hx2I";

const socket = io("http://192.168.0.166:5000", {
    transports: ["websocket", "polling"],
    auth: {
        token: JWT_TOKEN
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);
    socket.emit("join_room", "room123");

    console.log("Type a message and press Enter to send:");
    rl.on("line", (input) => {
        socket.emit("send_message", {
            room_id: "room123",
            sender_id: "user1",
            message: input
        });
    });
});

socket.on("load_messages", (msgs) => {
    console.log("📩 Loaded messages:", msgs);
});

socket.on("message_status_update", (data) => {
    console.log("📊 Status update:", data);
});

socket.on("connect_error", (err) => {
    console.error("❌ Connect error:", err.message);
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected");
});