import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    activeUsers: [],
    certificate: null,
    connectedUsers: new Map()
  },
  reducers: {
    setActiveUsers: (state, action) => {
      state.activeUsers = action.payload;
    },
    setCertificate: (state, action) => {
      state.certificate = action.payload;
    }
  }
});
export const { setActiveUsers, setCertificate } = chatSlice.actions;
export default chatSlice.reducer;
