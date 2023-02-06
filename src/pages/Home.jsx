/* eslint-disable no-unused-vars */
import {
  Avatar,
  Grid,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography
} from "@mui/material";
import { Stomp } from "@stomp/stompjs";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SockJS from "sockjs-client";
import ChatBox from "../components/ChatBox";
import { setActiveUsers } from "../redux/slices/chatSlice";

const Home = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const [stompClient, setStompClient] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    const sock = new SockJS("https://localhost:8080/chat");
    const stompClient = Stomp.over(sock);

    stompClient.connect({}, (frame) => {
      stompClient.subscribe("/topic/active-users", (message) => {
        setActiveUsers(JSON.parse(message.body));
      });
      stompClient.subscribe("/user/queue/messages", (message) =>
        console.log(message.body)
      );
    });
    setStompClient(stompClient);
  }, []);

  return (
    <Grid
      container
      spacing={2}
      sx={{
        alignItems: "center",
        justifyContent: "flex-start",
        height: "89vh"
      }}
    >
      <Grid item xs={3} sx={{ height: "inherit" }}>
        <Paper elevation={3} sx={{ height: "inherit" }}>
          <Typography
            sx={{ textAlign: "center", py: 2 }}
            variant="h6"
            component="div"
          >
            Active users
          </Typography>
          <List>
            { activeUsers.map((u) => u.id !== user.id && (
              <ListItemButton key={u.id}>
                <ListItemAvatar>
                  <Avatar>
                    {u.username.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={u.username} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Grid>
      <Grid item xs={9} sx={{ height: "inherit" }}>
        <ChatBox />
      </Grid>
    </Grid>
  );
};

export default Home;
