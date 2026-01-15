import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http'
import { Server } from 'socket.io';
import connectDB from './utils/db.js';
import userRoutes from './routes/user.route.js';
import messageRoutes from './routes/message.route.js'
import authRoutes from './routes/auth.route.js';
import translateRoutes from './routes/translate.route.js';
import chatRoomRoutes from './routes/chatRoom.route.js';
import { auth } from './middlewares/auth.middleware.js';
import { Message } from './model/message.model.js';
import { ChatRoom } from './model/chatRoom.model.js';

dotenv.config({});

const onlineUsers = new Set();
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const corsOption = {
    origin: 'http://localhost:5173',
    credentials: true
}

app.use(cors(corsOption));
app.use('/api/user', auth, userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chatRoom', auth, chatRoomRoutes);
app.use('/api/message', auth, messageRoutes);
<<<<<<< HEAD
app.use('/api/translate', auth, translateRoutes);
=======
app.use('/api/translate',auth,translateRoutes);
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556

io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId;
    socket.join(userId);
    console.log('user connected to the personal room');
    onlineUsers.add(userId);
    io.emit('update-online-status', Array.from(onlineUsers));

<<<<<<< HEAD
    const result = await Message.updateMany(
        {
            sender: { $ne: userId },          // not sent by me
            deliveredTo: { $ne: userId }      // not delivered to me yet
        },
        {
            $addToSet: { deliveredTo: userId }
=======


    socket.on('sendMessage', (messageData) => {
        io.to(messageData.message.chatRoom._id).emit('receiveMessage', messageData.message);

        if (userId && messageData.recipientId) {
            io.to(messageData.recipientId).emit('receiveMessage', messageData.message);
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
        }
    );

    if (result.modifiedCount > 0) {
        const affectedChatRooms = await Message.distinct("chatRoom", {
            deliveredTo: userId,
            sender: { $ne: userId }
        });

        affectedChatRooms.forEach(chatRoomId => {
            io.to(chatRoomId.toString()).emit("msgDeliveredBulk", {
                deliveredtoId: userId
            });
        });
    }



    socket.on('sendMessage', async ({ message }) => {
        const chatRoomId = message.chatRoom._id;

        const chatRoom = await ChatRoom.findById(chatRoomId).select('members');

        chatRoom.members.forEach(memberId => {
            if (memberId.toString() !== message.sender._id.toString()) {
                io.to(memberId.toString()).emit('receiveMessage', message);
                io.to(memberId.toString()).emit('incrementUnread', {
                    chatRoomId,
                    message
                })
            }
        })
    });

    // socket.on('leavePersonalRoom', (personalRoom) => {
    //     socket.leave(personalRoom);
    //     console.log(`User left the personal room: ${personalRoom}`);
    // });

    socket.on("ack-Delivered", async ({ messageId, senderId, chatRoomId }) => {
        console.log('dont worry you are coming here');
        console.log("ACK reached server for:", messageId);
        const updated = await Message.findByIdAndUpdate(
            messageId,
            { $addToSet: { deliveredTo: userId } },
            { new: true }
        );


        console.log("Emitting msgDelivered to:", senderId);

        io.to(senderId).emit("msgDelivered", {
            messageId: updated._id,
            senderId,
            deliveredtoId: userId
        });
    });

<<<<<<< HEAD
    socket.on("readMessages", async ({ chatRoomId, userId }) => {
        await Message.updateMany(
            {
                chatRoom: chatRoomId,
                sender: { $ne: userId },
                readBy: { $ne: userId }
            },
            { $addToSet: { readBy: userId } }
        );
        console.log('idhar ho tum');
        io.to(chatRoomId).emit("msgsRead", { chatRoomId, readerId: userId });
=======
    socket.on('delivered', (message) => {
        io.to(message.chatRoom._id).emit('msgDelivered', message);
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
    });




    socket.on('typing', (typingObj) => {
        io.to(typingObj.chatRoomId).emit('displayTyping', typingObj.userId);
    })

    socket.on('stopTyping', (typingObj) => {
        io.to(typingObj.chatRoomId).emit('removeTyping', typingObj.userId);
    })

    socket.on('joinRoom', (chatRoomId) => {
        socket.join(chatRoomId);
        // io.to(chatRoomId).emit('msgsRead');
        console.log(`User ${socket.id} joined chat room ${chatRoomId}`);
    });

    socket.on("leaveRoom", (chatRoomId) => {
        socket.leave(chatRoomId);
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(userId);
        io.emit('update-online-status', Array.from(onlineUsers));
        console.log('User disconnected:', socket.id);
    });

});


httpServer.listen(port, () => {
    connectDB();
    console.log(`Server running at port ${port}`);
});

export { io };