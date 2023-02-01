import { createTheme, ThemeProvider } from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
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

  console.log("1");

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <Routes>
        <Route
          exact
          path="/"
          element={<Home />}
        />
        <Route path="*" element={<Navigate to={"/"} />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
