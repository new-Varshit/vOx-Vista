import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import chatReducer from './chatSlice';
import ChatRoomReducer from './chatRoomSlice';

const store = configureStore({
  reducer: {
    auth: authReducer, 
    chat: chatReducer,
    chatRoom: ChatRoomReducer
  },
});

export default store;
