const db = require('../config/db');

const Message = {

  create: async (data) => {
    const { room_id, sender_id, receiver_id, message, message_type, file_url } = data;

    const [result] = await db.execute(
      `INSERT INTO messages 
       (room_id, sender_id, receiver_id, message, message_type, file_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'sent')`,
      [room_id, sender_id, receiver_id, message, message_type || 'text', file_url || null]
    );

    return result.insertId;
  },

  // Find messages by room (with optional history union)
  findByRoom: async (room_id, user_id, include_history = false) => {
    let query = `
      SELECT m.id, m.room_id, m.sender_id, m.receiver_id, m.message, m.message_type, m.file_url, m.status, m.created_at,
             u.name as sender_name, u.profile_image as sender_image, u.user_id as sender_custom_id
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.room_id = ?
    `;

    if (include_history) {
      query = `
        (${query})
        UNION ALL
        (SELECT mh.original_msg_id as id, mh.room_id, mh.sender_id, mh.receiver_id, mh.message, mh.message_type, mh.file_url, mh.status, mh.created_at,
                u.name as sender_name, u.profile_image as sender_image, u.user_id as sender_custom_id
         FROM message_history mh
         LEFT JOIN users u ON mh.sender_id = u.id
         WHERE mh.room_id = ?)
      `;
    }

    query += " ORDER BY created_at ASC";
    const params = include_history ? [room_id, room_id] : [room_id];
    const [rows] = await db.execute(query, params);
    return rows;
  },

  findPrivateChat: async (user1_id, user2_id, include_history = false, limit = 20, offset = 0) => {
    let query = `
      SELECT m.id, m.room_id, m.sender_id, m.receiver_id, m.message, m.message_type, m.file_url, m.status, m.created_at,
             u.name as sender_name, u.profile_image as sender_image, u.user_id as sender_custom_id
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
    `;

    if (include_history) {
      query = `
        (${query})
        UNION ALL
        (SELECT mh.original_msg_id as id, mh.room_id, mh.sender_id, mh.receiver_id, mh.message, mh.message_type, mh.file_url, mh.status, mh.created_at,
                u.name as sender_name, u.profile_image as sender_image, u.user_id as sender_custom_id
         FROM message_history mh
         LEFT JOIN users u ON mh.sender_id = u.id
         WHERE ((mh.sender_id = ? AND mh.receiver_id = ?) OR (mh.sender_id = ? AND mh.receiver_id = ?)))
      `;
    }

    query += " ORDER BY created_at ASC LIMIT ? OFFSET ?";
    
    let params = include_history 
      ? [user1_id, user2_id, user2_id, user1_id, user1_id, user2_id, user2_id, user1_id] 
      : [user1_id, user2_id, user2_id, user1_id];
    
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.execute(query, params);
    // Return messages in chronological order (ASC) for the UI
    return rows.reverse();
  },

  updateStatus: async (message_id, status) => {
    await db.execute(
      "UPDATE messages SET status=? WHERE id=?",
      [status, message_id]
    );
  },

  markRoomRead: async (room_id, user_id) => {
    await db.execute(
      `UPDATE messages 
       SET status='read'
       WHERE room_id=? AND receiver_id=? AND status!='read'`,
      [room_id, user_id]
    );
  },

  // getChatList: async (user_id) => {
  //   const [rows] = await db.execute(
  //       `SELECT 
  //           m1.*,
  //           cr.room_name,
  //           cr.room_type,
  //           cr.room_code,
  //           u.name as other_user_name,
  //           u.profile_image as other_user_image,
  //           u.user_id as other_user_custom_id,
  //           u.id as other_user_id,
  //           (SELECT COUNT(*) FROM messages 
  //            WHERE room_id = m1.room_id 
  //            AND receiver_id = ? 
  //            AND status != 'read') as unread_count
  //       FROM messages m1
  //       INNER JOIN (
  //           SELECT 
  //               room_id, 
  //               MAX(created_at) as max_created_at
  //           FROM messages
  //           WHERE room_id IN (
  //               SELECT room_id FROM room_maps WHERE user_id = ?
  //           )
  //           GROUP BY room_id
  //       ) m2 ON m1.room_id = m2.room_id AND m1.created_at = m2.max_created_at
  //       LEFT JOIN chat_rooms cr ON m1.room_id = CAST(cr.id AS CHAR) OR m1.room_id = cr.room_code
  //       LEFT JOIN users u ON (
  //           (cr.room_type = 'private') AND (
  //               (m1.sender_id = ? AND u.id = m1.receiver_id) OR 
  //               (m1.receiver_id = ? AND u.id = m1.sender_id)
  //           )
  //       )
  //       ORDER BY m1.created_at DESC`,
  //       [user_id, user_id, user_id, user_id]
  //   );
  //   return rows;
  // }
  getChatList: async (user_id) => {
    const [rows] = await db.execute(
        `SELECT 
            m1.*,
            cr.room_name,
            cr.room_type,
            cr.room_code,
            u.name as other_user_name,
            u.profile_image as other_user_image,
            u.user_id as other_user_custom_id,
            u.id as other_user_id,
            (SELECT COUNT(*) FROM messages 
             WHERE room_id = m1.room_id 
             AND receiver_id = ? 
             AND status != 'read') as unread_count
        FROM messages m1
        INNER JOIN (
            SELECT 
                room_id, 
                MAX(created_at) as max_created_at
            FROM messages
            WHERE room_id COLLATE utf8mb4_unicode_ci IN (
                SELECT room_id COLLATE utf8mb4_unicode_ci FROM room_maps WHERE user_id = ?
            )
            GROUP BY room_id
        ) m2 ON m1.room_id = m2.room_id AND m1.created_at = m2.max_created_at
        LEFT JOIN chat_rooms cr 
            ON m1.room_id COLLATE utf8mb4_unicode_ci = CAST(cr.id AS CHAR) COLLATE utf8mb4_unicode_ci 
            OR m1.room_id COLLATE utf8mb4_unicode_ci = cr.room_code COLLATE utf8mb4_unicode_ci
        LEFT JOIN users u ON (
            (cr.room_type = 'private') AND (
                (m1.sender_id = ? AND u.id = m1.receiver_id) OR 
                (m1.receiver_id = ? AND u.id = m1.sender_id)
            )
        )
        ORDER BY m1.created_at DESC`,
        [user_id, user_id, user_id, user_id]
    );
    return rows;
}
};

module.exports = Message;
