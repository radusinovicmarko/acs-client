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
import moment from "moment/moment";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SockJS from "sockjs-client";
import ChatBox from "../components/ChatBox";
import {
  addConnectedUser,
  addMessage,
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageReceived, setMessageReceived] = useState(null);

  const selector = createSelector(
    (state) => state.chat,
    (chat) => chat
  );
  const { certificate, activeUsers, requests, connectedUsers, privateKey } =
    useSelector(selector);

  const sendMessage = (content) => {
    const data = {
      content,
      dateTime: moment()
    };
    const message = {
      senderUsername: user.username,
      receiverUsername: selectedUser.username,
      data: JSON.stringify(cryptoService.encyptAes(selectedUser.aesKey, data)),
      noSegments: 1,
      segmentSerial: 1,
      syn: false,
      sendCert: false,
      ackCert: false,
      sendKey: false,
      ackKey: false,
      fin: false
    };
    console.log(JSON.parse(message.data));
    stompClient.send("/acs/message", {}, JSON.stringify(message));
    dispatch(addMessage({
      username: selectedUser.username,
      message: data
    }));
  };

  useEffect(() => {
    if (sendKey) {
      const receiverPubKey = cryptoService.certificateFromPem(
        sendKey.data
      ).publicKey;
      const aesKey = cryptoService.createAesKey();
      const aesKeyEnc = cryptoService.encryptWithPublicKey(
        receiverPubKey,
        JSON.stringify(aesKey)
      );
      const msg = {
        senderUsername: user.username,
        receiverUsername: sendKey.senderUsername,
        data: JSON.stringify(aesKeyEnc),
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
      dispatch(
        addConnectedUser({
          username: sendKey.senderUsername,
          aesKey,
          messages: []
        })
      );
    }
  }, [sendKey]);

  useEffect(() => {
    if (receiveKey) {
      const msg = {
        senderUsername: user.username,
        receiverUsername: receiveKey.senderUsername,
        data: receiveKey.data,
        noSegments: 1,
        segmentSerial: 1,
        syn: true,
        sendCert: false,
        ackCert: false,
        sendKey: true,
        ackKey: true,
        fin: false
      };
      stompClient.send("/acs/message", {}, JSON.stringify(msg));
      dispatch(
        addConnectedUser({
          username: receiveKey.senderUsername,
          aesKey: JSON.parse(
            cryptoService.decryptWithPrivateKey(
              privateKey,
              JSON.parse(receiveKey.data)
            )
          ),
          messages: []
        })
      );
    }
  }, [receiveKey]);

  useEffect(() => {
    if (messageReceived) {
      const data = JSON.parse(messageReceived.data);
      console.log(data);
      const aesKey = connectedUsers.filter((u) => u.username === messageReceived.senderUsername)[0].aesKey;
      dispatch(addMessage({
        username: messageReceived.senderUsername,
        message: cryptoService.decryptAes(aesKey, data)
      }));
    }
  }, [messageReceived]);

  const connect = (receiver) => {
    const message = {
      senderUsername: user.username,
      receiverUsername: receiver.username,
      data: cryptoService.certificateToPem(certificate),
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
      data: cryptoService.certificateToPem(certificate),
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
        const msg = JSON.parse(JSON.parse(message.body));
        if (msg.syn) {
          if (msg.sendCert && !msg.ackCert) {
            dispatch(
              addRequest({
                username: msg.senderUsername,
                cert: cryptoService.certificateFromPem(msg.data)
              })
            );
          } else if (msg.sendCert && msg.ackCert) {
            setSendKey(msg);
          } else if (msg.sendKey && !msg.ackKey) {
            setReceiveKey(msg);
          } /* else if (msg.sendKey && msg.ackKey) {
          } */
        } else {
          setMessageReceived(msg);
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
            {requests.map((u) => (
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
            ))}
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
            {connectedUsers?.map((u) => (
              <ListItem
                key={u.username}
                secondaryAction={
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedUser(u)}
                  >
                    Chat
                  </Button>
                }
              >
                <ListItemText primary={u.username} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
      <Grid item xs={9} sx={{ height: "inherit" }}>
        {selectedUser && (
          <ChatBox
            username={selectedUser.username}
            onSend={sendMessage}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default Home;
