import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import chatSlice from "./slices/chatSlice";
import userSlice from "./slices/userSlice";

export default configureStore({
  reducer: {
    user: userSlice,
    chat: chatSlice
  },
  middleware: getDefaultMiddleware({ serializableCheck: false })
});
