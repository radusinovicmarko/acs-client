import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import cryptoService, { getCertificateFromDer } from "../../services/crypto.service";
import messageService from "../../services/message.service";

const processMessage = (state, part) => {
  const exists = state.messages.filter((m) => m.id === part.id).length > 0;
  if (exists) {
    const message = state.messages.filter((m) => m.id === part.id)[0];
    if (message.parts.filter((p) => p.segmentSerial === part.segmentSerial).length === 0) {
      message.parts = [...message.parts, part];
    }
  } else {
    state.messages.push({ id: part.id, noSegments: part.noSegments, parts: [part] });
  }
  const message = state.messages.filter((m) => m.id === part.id)[0];
  if (message.parts.length === message.noSegments) {
    const msg = messageService.combineParts(message.parts);
    state.connectedUsers.forEach((u) => {
      if (u.username === msg.sender) {
        if (u.messages.filter((m) => m.id === msg.id).length === 0) {
          u.messages = [...u.messages, msg];
        }
      }
    });
  }
};

export const addPart = createAsyncThunk(
  "chat/addPart",
  (message, thunkAPI) => {
    const data = JSON.parse(message.data);
    if (message.image) {
      return cryptoService.steganographyDecode(data)
        .then((res) => {
          return {
            ...message,
            data: res
          };
        });
    } else {
      return message;
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    activeUsers: [],
    requests: [],
    certificate: null,
    privateKey: null,
    connectedUsers: [],
    messages: []
  },
  reducers: {
    setActiveUsers: (state, action) => {
      state.activeUsers = action.payload;
      let requestsTemp = [];
      state.requests.forEach((r) => {
        if (state.activeUsers.filter((u) => u.username === r.username).length !== 0) requestsTemp = [...requestsTemp, r];
      });
      state.requests = requestsTemp;
      let connectedUsersTemp = [];
      state.connectedUsers.forEach((cu) => {
        if (state.activeUsers.filter((u) => u.username === cu.username).length !== 0) connectedUsersTemp = [...connectedUsersTemp, cu];
      });
      state.connectedUsers = connectedUsersTemp;
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
      state.connectedUsers = [];
      state.messages = [];
    },
    addRequest: (state, action) => {
      const cert = action.payload.cert;
      if (
        cert.verify(cert) &&
        Date.now() > cert.validity.notBefore.getTime() &&
        Date.now() < cert.validity.notAfter.getTime()
      ) {
        if (state.requests.filter((r) => r.id === action.payload.id).length === 0) {
          state.requests = [...state.requests, action.payload];
        }
      }
    },
    addConnectedUser: (state, action) => {
      const connectedUser = action.payload;
      if (state.connectedUsers.filter((u) => u.username === connectedUser.username).length === 0) {
        state.activeUsers = state.activeUsers.filter((u) => u.username !== connectedUser.username);
        state.requests = state.requests.filter((u) => u.username !== connectedUser.username);
        state.connectedUsers = [...state.connectedUsers, connectedUser];
      }
    },
    addMessage: (state, action) => {
      const { username, message } = action.payload;
      state.connectedUsers.forEach((u) => {
        if (u.username === username) {
          if (u.messages.filter((m) => m.id === message.id).length === 0) {
            u.messages = [...u.messages, message];
          }
        }
      });
    }
  },
  extraReducers: (builder) => {
    builder.addCase(addPart.fulfilled, (state, action) => {
      const data = JSON.parse(action.payload.data);
      const aesKey = state.connectedUsers.filter(
        (u) => u.username === action.payload.senderUsername
      )[0].aesKey;
      const part = cryptoService.decryptAes(aesKey, data);
      const pubKey = state.connectedUsers.filter(
        (u) => u.username === action.payload.senderUsername
      )[0].pubKey;
      if (cryptoService.verify(pubKey, action.payload.sign, part)) {
        processMessage(state, part);
      }
    });
  }
});
export const { setActiveUsers, setCertificate, clear, addRequest, addConnectedUser, addMessage } = chatSlice.actions;
export default chatSlice.reducer;
