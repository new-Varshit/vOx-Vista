import {createSlice} from '@reduxjs/toolkit';


const lngSlice = createSlice({
    name:'lng',
    initialState: {
        targetLanguage: null,
    },
    reducers: {
        setTargetLanguage: (state,action) =>{
            state.targetLanguage = action.payload;
        },
        clearTargetLanguage: (state) =>{
            state.targetLanguage = null;
        },
    },
});

export const {setTargetLanguage,clearTargetLanguage} = lngSlice.actions;
export default lngSlice.reducer;