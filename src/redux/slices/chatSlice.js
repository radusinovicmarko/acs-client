/* eslint-disable no-unused-vars */
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
    console.log(message);
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
        const pubKey = state.requests.filter((u) => u.username === connectedUser.username);
        state.activeUsers = state.activeUsers.filter((u) => u.username !== connectedUser.username);
        state.requests = state.requests.filter((u) => u.username !== connectedUser.username);
        state.connectedUsers = [...state.connectedUsers, { ...connectedUser, pubKey }];
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
    /* addPart: (state, action) => {
      const data = JSON.parse(action.payload.data);
      const aesKey = state.connectedUsers.filter(
        (u) => u.username === action.payload.senderUsername
      )[0].aesKey;
      if (action.payload.image) {
        cryptoService.steganographyDecode(data)
          .then((res) => {
            const part = cryptoService.decryptAes(aesKey, JSON.parse(res));
            // const messageWhole = action.payload;
            processMessage(state, part);
          });
      } else {
        const part = cryptoService.decryptAes(aesKey, data);
        // const messageWhole = action.payload;
        processMessage(state, part);
      }
    } */
  },
  extraReducers: (builder) => {
    builder.addCase(addPart.fulfilled, (state, action) => {
      console.log(action.payload.data);
      const data = JSON.parse(action.payload.data);
      const aesKey = state.connectedUsers.filter(
        (u) => u.username === action.payload.senderUsername
      )[0].aesKey;
      const part = cryptoService.decryptAes(aesKey, data);
      processMessage(state, part);
    });
  }
});
export const { setActiveUsers, setCertificate, clear, addRequest, addConnectedUser, addMessage } = chatSlice.actions;
export default chatSlice.reducer;
