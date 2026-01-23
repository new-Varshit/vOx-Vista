import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http'
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
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
        origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
        credentials: true
    }
});

function getCookieValue(cookieHeader, name) {
    if (!cookieHeader) return null;
    const parts = cookieHeader.split(';').map(p => p.trim());
    for (const part of parts) {
        const [k, ...rest] = part.split('=');
        if (k === name) return rest.join('=') || null;
    }
    return null;
}

io.use((socket, next) => {
    try {
        const tokenFromAuth = socket.handshake?.auth?.token;
        const tokenFromCookie = getCookieValue(socket.handshake?.headers?.cookie, 'token');
        const token = tokenFromAuth || tokenFromCookie;

        if (!token) return next(new Error('Unauthorized'));

        const decoded = jwt.verify(token, process.env.SECRET_KEY); // { userId, iat, exp }
        const userId = decoded?.userId;
        if (!userId) return next(new Error('Unauthorized'));

        socket.userId = userId;
        return next();
    } catch (e) {
        return next(new Error('Unauthorized'));
    }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const corsOption = {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true
}

app.use(cors(corsOption));
app.use('/api/user', auth, userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chatRoom', auth, chatRoomRoutes);
app.use('/api/message', auth, messageRoutes);
app.use('/api/translate', auth, translateRoutes);

io.on('connection', async (socket) => {
    const userId = socket.userId;
    socket.join(userId);
    console.log('user connected to the personal room');
    onlineUsers.add(userId);
    io.emit('update-online-status', Array.from(onlineUsers));

    const rooms = await ChatRoom.find({ members: userId }, { _id: 1 });
            //  console.log('rooms',rooms);
    const roomIds = rooms.map(room => room._id);
            //   console.log('roomIds',roomIds);
    const result = await Message.updateMany(
        {
            chatRoom: { $in: roomIds },
            sender: { $ne: userId },          // not sent by me
            deliveredTo: { $ne: userId }      // not delivered to me yet
        },
        {
            $addToSet: { deliveredTo: userId }
        }
    );
    // console.log('yo hue ', userId);
    // console.log(result.modifiedCount, userId);
    if (result.modifiedCount > 0) {
        const affectedChatRooms = await Message.distinct("chatRoom", {
            deliveredTo: userId,
            sender: { $ne: userId }
        });

        // console.log('emitting msgDeliveredBulk')
        affectedChatRooms.forEach(chatRoomId => {
            // console.log(chatRoomId);
            io.to(chatRoomId.toString()).emit("msgDeliveredBulk", {
                deliveredtoId: userId
            });
        });
    }



    socket.on('sendMessage', async ({ message }) => {
        const chatRoomId = message.chatRoom._id;

        // Authorization: only allow members of the room to broadcast
        const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, members: userId }).select('members');
        if (!chatRoom) return;

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
      
        const updated = await Message.findByIdAndUpdate(
            messageId,
            { $addToSet: { deliveredTo: userId } },
            { new: true }
        );



        io.to(senderId).emit("msgDelivered", {
            messageId: updated._id,
            senderId,
            deliveredtoId: userId
        });
    });

    socket.on("readMessages", async ({ chatRoomId }) => {
        const isMember = await ChatRoom.exists({ _id: chatRoomId, members: userId });
        if (!isMember) return;

        await Message.updateMany(
            {
                chatRoom: chatRoomId,
                sender: { $ne: userId },
                readBy: { $ne: userId }
            },
            { $addToSet: { readBy: userId } }
        );
        io.to(chatRoomId).emit("msgsRead", { chatRoomId, readerId: userId });
    });




    socket.on('typing', (typingObj) => {
        io.to(typingObj.chatRoomId).emit('displayTyping', typingObj.userId);
    })

    socket.on('stopTyping', (typingObj) => {
        io.to(typingObj.chatRoomId).emit('removeTyping', typingObj.userId);
    })

    socket.on('joinRoom', (chatRoomId) => {
        // NOTE: authorization is required to prevent joining arbitrary rooms
        ChatRoom.exists({ _id: chatRoomId, members: userId })
            .then((ok) => {
                if (!ok) return;
                socket.join(chatRoomId);
                console.log(`User ${socket.id} joined chat room ${chatRoomId}`);
            })
            .catch(() => { });
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