import { createSlice } from "@reduxjs/toolkit";

const initialState = {
     lastMessage : null
}

const lastMessageSlice = createSlice({
    name:'lastMessage',
    initialState,
    reducers:{
        setLastMessage:(state,action)=>{
            state.lastMessage = action.payload
        },
        clearLastMessage:(state)=>{
            state.lastMessage = null;
        }
    }
})

export const {setLastMessage,clearLastMessage} = lastMessageSlice.actions;

export default lastMessageSlice.reducer;