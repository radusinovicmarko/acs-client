import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import userSlice from "./slices/userSlice";

export default configureStore({
  reducer: {
    user: userSlice
  },
  middleware: getDefaultMiddleware({ serializableCheck: false })
});
