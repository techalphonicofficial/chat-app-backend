CREATE DATABASE IF NOT EXISTS chatapps;

USE chatapps;


CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id VARCHAR(50) UNIQUE NOT NULL,

    passkey_hash VARCHAR(255) NOT NULL,

    name VARCHAR(255) DEFAULT NULL,

    mobile_number VARCHAR(20) DEFAULT NULL,

    profile_image VARCHAR(255) DEFAULT NULL,

    passkey VARCHAR(255) DEFAULT NULL,

    role ENUM('admin', 'user') DEFAULT 'user',

    is_online BOOLEAN DEFAULT FALSE,

    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    is_deleted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS chat_rooms (

    id INT AUTO_INCREMENT PRIMARY KEY,

    room_name VARCHAR(100) DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



CREATE TABLE IF NOT EXISTS room_participants (

    id INT AUTO_INCREMENT PRIMARY KEY,

    room_id INT,

    user_id INT,

    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

);



CREATE TABLE IF NOT EXISTS messages (

    id INT AUTO_INCREMENT PRIMARY KEY,

    room_id VARCHAR(255) NOT NULL,

    sender_id INT NOT NULL,

    receiver_id INT NOT NULL,

    message TEXT,

    message_type ENUM('text', 'image', 'document') DEFAULT 'text',

    file_url VARCHAR(500) DEFAULT NULL,

    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);





