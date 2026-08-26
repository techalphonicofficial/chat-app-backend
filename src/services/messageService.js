const Message = require('../models/messageModel');

const Room = require('../models/roomModel');



const sendMessageService = async (io, data, sender_role) => {

  let { room_id, sender_id, receiver_id } = data;



  // If no room_id but receiver_id is present, it's a private chat

  if (!room_id && receiver_id) {

    let room = await Room.findPrivateRoom(sender_id, receiver_id);

    if (!room) {

      // ONLY ADMIN can create a new room

      // if (sender_role !== 'admin') {

      //   throw new Error('Only Admin can initiate a new chat.');

      // }

      room_id = await Room.createPrivateRoom(sender_id, receiver_id);

    } else {

      room_id = room.id;

    }

    data.room_id = room_id.toString();

  }





  const insertId = await Message.create(data);



  const newMessage = {

    id: insertId,

    ...data,

    status: "sent",

    created_at: new Date()

  };



  // realtime emit

  if (io) {

    io.to(data.room_id).emit("receive_message", newMessage);

  }



  return newMessage;

};



module.exports = { sendMessageService };



