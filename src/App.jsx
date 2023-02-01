import { createTheme, ThemeProvider } from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Router } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import { state } from "./redux/slices/userSlice";

function App () {
  const theme = createTheme({
    palette: {
      mode: "light",
      primary: {
        main: "#1976d2"
      },
      secondary: {
        main: "#711A75"
      },
      text: {
        main: "white"
      }
    }
  });

  const dispatch = useDispatch();

  const { authenticated } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    dispatch(state());
  }, []);

  if (!authenticated) return <Login />;

  return (
    <Router>
      <ThemeProvider theme={theme}>
      </ThemeProvider>
    </Router>
  );
}

export default App;
