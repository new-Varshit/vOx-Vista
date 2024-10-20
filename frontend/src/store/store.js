import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import chatReducer from './chatSlice';
import ChatRoomReducer from './chatRoomSlice';
import lastMessageReducer from './lastMessageSlice';

const store = configureStore({
  reducer: {
    auth: authReducer, 
    chat: chatReducer,
    chatRoom: ChatRoomReducer,
    lastMessage:lastMessageReducer
  },
});

export default store;
