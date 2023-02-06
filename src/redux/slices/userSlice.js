import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import authService from "../../services/auth.service";

export const login = createAsyncThunk(
  "user/login",
  ({ username, password }, thunkAPI) =>
    authService.login(username, password).catch(thunkAPI.rejectWithValue)
);

export const state = createAsyncThunk("user/state", (_, { rejectWithValue }) =>
  authService.state()
);

export const logout = createAsyncThunk("user/logout", (username, _) =>
  authService.logout(username)
);

const logoutAction = (state, action) => {
  state.activated = false;
  state.authenticated = false;
  state.loading = false;
  state.user = null;
  state.pendingActivation = false;
};

const onSuccessAuth = (state, action) => {
  state.authenticationFailed = false;
  state.loading = false;
  state.authenticated = true;
  state.user = action.payload;
};

const userSlice = createSlice({
  name: "user",
  initialState: {
    keystorePassword: "",
    authenticated: false,
    authenticationFailed: false,
    loading: false,
    user: null
  },
  reducers: {
    setKeystorePassword: (state, action) => {
      state.keystorePassword = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, onSuccessAuth);
    builder.addCase(login.rejected, (state, action) => {
      state.authenticated = false;
      state.authenticationFailed = true;
      state.loading = false;
    });
    builder.addCase(login.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(state.fulfilled, onSuccessAuth);
    builder.addCase(state.rejected, (state, action) => {
      state.authenticated = false;
      state.authenticationFailed = true;
      state.loading = false;
    });
    builder.addCase(logout.fulfilled, logoutAction);
  }
});
export const { setKeystorePassword } = userSlice.actions;
export default userSlice.reducer;
