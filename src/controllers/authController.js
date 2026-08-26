const db = require("../config/db");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const Room = require("../models/roomModel");



exports.checkUser = async (req, res) => {

  const { user_id } = req.body;



  try {

    const [result] = await db.execute(

      "SELECT id FROM users WHERE user_id = ?",

      [user_id]

    );



    if (result.length === 0) {

      return res.json({ status: false, message: "Invalid User ID" });

    }



    res.json({ status: true, message: "User Found" });

  } catch (err) {

    res.status(500).json(err);

  }

};

exports.register = async (req, res) => {

  const { user_id, passkey, role, name } = req.body;



  try {

    // Validate fields

    if (!user_id || !passkey || !role) {

      return res.status(400).json({

        status: false,

        message: "User ID, Passkey, and Role are required",

      });

    }



    // Check existing user

    const [existing] = await db.execute(

      "SELECT id FROM users WHERE user_id = ?",

      [user_id]

    );



    if (existing.length > 0) {

      return res.status(400).json({

        status: false,

        message: "User ID already exists",

      });

    }



    // Hash password

    const salt = await bcrypt.genSalt(10);

    const passkey_hash = await bcrypt.hash(passkey, salt);



    // Handle profile image if uploaded

    let profile_image = null;

    if (req.file) {

      profile_image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    }



    // Insert user

    const [result] = await db.execute(

      "INSERT INTO users (user_id, passkey_hash, role, profile_image, name) VALUES (?, ?, ?, ?, ?)",

      [user_id, passkey_hash, role, profile_image, name || null]

    );



    return res.status(201).json({

      status: true,

      message: "User registered successfully",

      id: result.insertId,

      user_id,

      name,

      role,

      profile_image

    });



  } catch (err) {

    console.error(err);



    return res.status(500).json({

      status: false,

      message: "Server error",

    });

  }

};



exports.login = async (req, res) => {

  const { user_id, passkey } = req.body;



  try {

    const [result] = await db.execute(

      "SELECT * FROM users WHERE user_id = ?",

      [user_id]

    );



    if (result.length === 0)

      return res.status(400).json({ message: "User not found" });



    const user = result[0];



    const isMatch = await bcrypt.compare(passkey, user.passkey_hash);

    if (!isMatch)

      return res.status(400).json({ message: "Wrong passkey" });



    const token = jwt.sign(

      { id: user.id, role: user.role },

      process.env.JWT_SECRET,

      { expiresIn: "7d" }

    );





    res.json({

      status: true,

      token,

      id: user.id,

      user_id: user.user_id,

      role: user.role,

    });

  } catch (err) {

    res.status(500).json(err);

  }

};

exports.listUsers = async (req, res) => {

  try {

    const { room_id } = req.query;

    const me_id = req.user.id;



    let query = `

      SELECT 

        u.id, u.user_id, u.name, u.mobile_number, u.profile_image, u.role, u.created_at,

        (SELECT message FROM messages 

         WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) 

         ORDER BY created_at DESC LIMIT 1) as last_message,

        (SELECT status FROM messages 

         WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) 

         ORDER BY created_at DESC LIMIT 1) as last_message_status

      FROM users u

    `;

    let params = [me_id, me_id, me_id, me_id];

    if (room_id) {

      query = `

    SELECT DISTINCT 

      u.id,

      u.user_id,

      u.name,

      u.mobile_number,

      u.profile_image,

      u.role,

      u.created_at,



      (

        SELECT m.message

        FROM messages m

        WHERE (m.sender_id = u.id OR m.receiver_id = u.id)

          AND m.room_id = ?

        ORDER BY m.created_at DESC

        LIMIT 1

      ) AS last_message,



      (

        SELECT 

          CASE

            WHEN m.receiver_id = ? THEN 'read'

            WHEN m.sender_id = ? THEN 'sent'

            ELSE m.status

          END

        FROM messages m

        WHERE (m.sender_id = u.id OR m.receiver_id = u.id)

          AND m.room_id = ?

        ORDER BY m.created_at DESC

        LIMIT 1

      ) AS last_message_status



    FROM users u

    JOIN room_maps rm ON u.id = rm.user_id

    WHERE rm.room_id = ?

  `;



      params = [

        room_id,

        me_id,

        me_id,

        room_id,

        room_id

      ];

    }

    const [users] = await db.execute(query, params);



    res.json({

      status: true,

      users

    });



  } catch (err) {

    console.error(err);

    res.status(500).json({

      status: false,

      message: "Server error"

    });

  }

};



exports.getAllUsers = async (req, res) => {

  try {

    const { id: me_id, role } = req.user;



    let query = `

      SELECT 

        u.id, u.user_id, u.name, u.mobile_number, u.profile_image, u.role, u.created_at

      FROM users u

    `;

    let params = [];



    // ISOLATION LOGIC: If not admin, only show room colleagues

    if (role !== 'admin') {

      query += `

        WHERE u.id IN (

          SELECT DISTINCT user_id FROM room_maps 

          WHERE room_id IN (SELECT room_id FROM room_maps WHERE user_id = ?)

        ) AND u.id != ?

      `;

      params.push(me_id, me_id);

    }



    const [users] = await db.execute(query, params);



    res.json({

      status: true,

      users

    });



  } catch (err) {

    console.error(err);

    res.status(500).json({

      status: false,

      message: "Server error"

    });

  }

};

exports.updateUser = async (req, res) => {

  const { id } = req.params;

  const {

    name, mobile_number, profile_image, role, passkey, user_id,

    room_id, can_view_previous_messages

  } = req.body;



  try {

    // 1. Fetch CURRENT data for history backup

    const [currentRows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);

    if (currentRows.length === 0) {

      return res.status(404).json({ status: false, message: "User not found" });

    }

    const currentUser = currentRows[0];



    // 2. Save snapshot to user_history

    await db.execute(

      `INSERT INTO user_history (user_record_id, name, custom_user_id, mobile_number, profile_image, role, passkey_hash) 

       VALUES (?, ?, ?, ?, ?, ?, ?)`,

      [

        currentUser.id,

        currentUser.name,

        currentUser.user_id,

        currentUser.mobile_number,

        currentUser.profile_image,

        currentUser.role,

        currentUser.passkey_hash

      ]

    );



    // 3. Update User Profile

    let updates = [];

    let params = [];



    if (name) { updates.push("name = ?"); params.push(name); }

    if (user_id) { updates.push("user_id = ?"); params.push(user_id); }

    if (mobile_number) { updates.push("mobile_number = ?"); params.push(mobile_number); }

    if (profile_image) { updates.push("profile_image = ?"); params.push(profile_image); }

    if (role) { updates.push("role = ?"); params.push(role); }



    if (passkey) {

      const salt = await bcrypt.genSalt(10);

      const passkey_hash = await bcrypt.hash(passkey, salt);

      updates.push("passkey_hash = ?");

      params.push(passkey_hash);

    }



    if (updates.length > 0) {

      let query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

      params.push(id);

      await db.execute(query, params);

    }



    // 4. Handle Chat Visibility (Global via user_privacy_settings)

    let chatMessage = "";

    if (can_view_previous_messages !== undefined) {

      const status = parseInt(can_view_previous_messages);



      // Update global privacy settings table

      await db.execute(

        `INSERT INTO user_privacy_settings (user_id, can_view_previous_messages) 

             VALUES (?, ?) 

             ON DUPLICATE KEY UPDATE can_view_previous_messages = ?`,

        [id, status, status]

      );



      if (status === 0) {

        await Room.archiveUserAllMessages(id);

        chatMessage = " and all chats archived";

      } else {

        await Room.restoreUserAllMessages(id);

        chatMessage = " and all chats restored";

      }

    }



    res.json({

      status: true,

      message: `User updated successfully${chatMessage}`,

    });



  } catch (err) {

    console.error("Update User Error:", err);

    res.status(500).json({ status: false, message: "Server error" });

  }

};

