
import { createSlice } from '@reduxjs/toolkit';

const chatRoomSlice = createSlice({
    name: 'chatRoom',
    initialState: {
        currentChatRoom: null,
    },
    reducers: {
        setCurrentChatRoom: (state, action) => {
            state.currentChatRoom = action.payload;
        },
        clearCurrentChatRoom: (state) => {
            state.currentChatRoom = null;
        },
    },
});

export const { setCurrentChatRoom, clearCurrentChatRoom } = chatRoomSlice.actions;
export default chatRoomSlice.reducer;
