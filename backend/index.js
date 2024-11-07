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
app.use('/api/translate',auth,translateRoutes);

io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId;
    socket.join(userId);
    onlineUsers.add(userId);
    io.emit('update-online-status', Array.from(onlineUsers));



    socket.on('sendMessage', (messageData) => {
        io.to(messageData.message.chatRoom).emit('receiveMessage', messageData.message);

        if (userId && messageData.recipientId) {
            io.to(messageData.recipientId).emit('receiveMessage', messageData.message);
        }
        // console.log('Message received from client:', messageData);
    });

    socket.on('leavePersonalRoom', (personalRoom) => {
        socket.leave(personalRoom);
        console.log(`User left the personal room: ${personalRoom}`);
    });

    socket.on('delivered', (message) => {
        io.to(message.chatRoom).emit('msgDelivered', message);
    });

    socket.on('typing', (typingObj) => {
        io.to(typingObj.chatRoomId).emit('displayTyping', typingObj.userId);
    })

    socket.on('stopTyping', (typingObj) => {
        io.to(typingObj.chatRoomId).emit('removeTyping', typingObj.userId);
    })

    socket.on('joinRoom', (chatRoomId) => {
        socket.join(chatRoomId);
        io.to(chatRoomId).emit('msgsRead');
        console.log(`User ${socket.id} joined chat room ${chatRoomId}`);
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