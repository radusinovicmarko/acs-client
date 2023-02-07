import { createSlice } from "@reduxjs/toolkit";
import { getCertificateFromDer } from "../../services/crypto.service";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    activeUsers: [],
    requests: [],
    certificate: null,
    privateKey: null,
    connectedUsers: []
  },
  reducers: {
    setActiveUsers: (state, action) => {
      state.activeUsers = action.payload;
    },
    setCertificate: (state, action) => {
      const { cert, password, cn } = action.payload;
      const { certificate, pk } = getCertificateFromDer(cert, password, cn);
      state.certificate = certificate;
      state.privateKey = pk;
    },
    clear: (state, action) => {
      state.activeUsers = [];
      state.certificate = null;
      state.connectedUsers = new Map();
    },
    addRequest: (state, action) => {
      if (state.requests.filter((r) => r.id === action.payload.id).length === 0) {
        state.requests = [...state.requests, action.payload];
      }
    },
    addConnectedUser: (state, action) => {
      const connectedUser = action.payload;
      console.log(connectedUser);
      if (state.connectedUsers.filter((u) => u.username === connectedUser.username).length === 0) {
        state.activeUsers = state.activeUsers.filter((u) => u.username !== connectedUser.username);
        state.requests = state.requests.filter((u) => u.username !== connectedUser.username);
        state.connectedUsers = [...state.connectedUsers, connectedUser];
      }
    }
  }
});
export const { setActiveUsers, setCertificate, clear, addRequest, addConnectedUser } = chatSlice.actions;
export default chatSlice.reducer;
