import {
  Avatar,
  Button,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography
} from "@mui/material";
import { createSelector } from "@reduxjs/toolkit";
import { Stomp } from "@stomp/stompjs";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SockJS from "sockjs-client";
import ChatBox from "../components/ChatBox";
import {
  addConnectedUser,
  addRequest,
  setActiveUsers
} from "../redux/slices/chatSlice";
import cryptoService from "../services/crypto.service";

const Home = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const [stompClient, setStompClient] = useState(null);
  const [sendKey, setSendKey] = useState(null);
  const [receiveKey, setReceiveKey] = useState(null);

  const selector = createSelector(
    (state) => state.chat,
    (chat) => chat
  );
  const { certificate, activeUsers, requests, connectedUsers } = useSelector(selector);

  useEffect(() => {
    if (sendKey) {
      const aesKey = cryptoService.createAesKey();
      const msg = {
        senderUsername: user.username,
        receiverUsername: sendKey.senderUsername,
        data: JSON.stringify(aesKey),
        noSegments: 1,
        segmentSerial: 1,
        syn: true,
        sendCert: false,
        ackCert: false,
        sendKey: true,
        ackKey: false,
        fin: false
      };
      console.log(msg);
      stompClient.send("/acs/message", {}, JSON.stringify(msg));
      dispatch(addConnectedUser({
        username: sendKey.senderUsername,
        aesKey
      }));
    }
  }, [sendKey]);

  useEffect(() => {
    if (receiveKey) {
      const msg = {
        senderUsername: user.username,
        receiverUsername: receiveKey.senderUsername,
        data: JSON.stringify(receiveKey.data),
        noSegments: 1,
        segmentSerial: 1,
        syn: true,
        sendCert: false,
        ackCert: false,
        sendKey: true,
        ackKey: true,
        fin: false
      };
      console.log(msg);
      stompClient.send("/acs/message", {}, JSON.stringify(msg));
      dispatch(addConnectedUser({
        username: receiveKey.senderUsername,
        aesKey: receiveKey.data
      }));
    }
  }, [receiveKey]);

  const connect = (receiver) => {
    const message = {
      senderUsername: user.username,
      receiverUsername: receiver.username,
      data: JSON.stringify(certificate),
      noSegments: 1,
      segmentSerial: 1,
      syn: true,
      sendCert: true,
      ackCert: false,
      sendKey: false,
      ackKey: false,
      fin: false
    };
    console.log(message);
    stompClient.send("/acs/message", {}, JSON.stringify(message));
  };

  const accept = (receiver) => {
    const message = {
      senderUsername: user.username,
      receiverUsername: receiver.username,
      data: JSON.stringify(certificate),
      noSegments: 1,
      segmentSerial: 1,
      syn: true,
      sendCert: true,
      ackCert: true,
      sendKey: false,
      ackKey: false,
      fin: false
    };
    console.log(message);
    stompClient.send("/acs/message", {}, JSON.stringify(message));
  };

  useEffect(() => {
    const sock = new SockJS("https://localhost:8080/chat");
    const stompClient = Stomp.over(sock);

    stompClient.connect({}, (frame) => {
      stompClient.subscribe("/topic/active-users", (message) => {
        dispatch(setActiveUsers(JSON.parse(message.body)));
      });
      stompClient.subscribe("/queue/messages/" + user.username, (message) => {
        let msg = JSON.parse(JSON.parse(message.body));
        msg = { ...msg, data: JSON.parse(msg.data) };
        console.log(msg);
        if (msg.syn) {
          if (msg.sendCert && !msg.ackCert) {
            console.log(1);
            dispatch(addRequest({
              username: msg.senderUsername,
              cert: msg.data
            }));
          } else if (msg.sendCert && msg.ackCert) {
            console.log(2);
            setSendKey(msg);
          } else if (msg.sendKey && !msg.ackKey) {
            console.log(3);
            setReceiveKey(msg);
          } else if (msg.sendKey && msg.ackKey) {
            console.log(4);
            dispatch(addConnectedUser({
              username: msg.senderUsername,
              aesKey: msg.data
            }));
          }
        }
      });
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
          <Divider />
          <List>
            {activeUsers.map(
              (u) =>
                u.id !== user.id && (
                  <ListItem
                    key={u.id}
                    secondaryAction={
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => connect(u)}
                      >
                        Connect
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>{u.username.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={u.username} />
                  </ListItem>
                )
            )}
          </List>
          <Typography
            sx={{ textAlign: "center", py: 2 }}
            variant="h6"
            component="div"
          >
            Requests
          </Typography>
          <Divider />
          <List>
            {requests.map(
              (u) =>
                (
                  <ListItem
                    key={u.username}
                    secondaryAction={
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => accept(u)}
                      >
                        Accept
                      </Button>
                    }
                  >
                    <ListItemText primary={u.username} />
                  </ListItem>
                )
            )}
          </List>
          <Typography
            sx={{ textAlign: "center", py: 2 }}
            variant="h6"
            component="div"
          >
            Connected users
          </Typography>
          <Divider />
          <List>
            {connectedUsers.map(
              (u) =>
                (
                  <ListItem
                    key={u.username}
                    secondaryAction={
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => accept(u)}
                      >
                        Chat
                      </Button>
                    }
                  >
                    <ListItemText primary={u.username} />
                  </ListItem>
                )
            )}
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
