import {
  Button,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography
} from "@mui/material";
import { createSelector } from "@reduxjs/toolkit";
import { Stomp } from "@stomp/stompjs";
import axios from "axios";
import moment from "moment/moment";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SockJS from "sockjs-client";
import ChatBox from "../components/ChatBox";
import {
  addConnectedUser,
  addMessage,
  addPart,
  addRequest,
  setActiveUsers
} from "../redux/slices/chatSlice";
import cryptoService from "../services/crypto.service";
import messageService from "../services/message.service";

const Home = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const [stompClient, setStompClient] = useState(null);
  const [sendKey, setSendKey] = useState(null);
  const [receiveKey, setReceiveKey] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [image, setImage] = useState(null);

  const selector = createSelector(
    (state) => state.chat,
    (chat) => chat
  );
  const { certificate, activeUsers, requests, connectedUsers, privateKey } =
    useSelector(selector);

  const sendMessage = (content) => {
    const parts = messageService.segmentMessage(content);
    const id = Date.now();
    const dateTime = moment();
    let i = 1;
    const steganographyIndex = Math.floor(Math.random() * parts.length) + 1;
    parts.forEach((p) => {
      const data = {
        content: p,
        dateTime,
        id,
        sender: user.username,
        noSegments: parts.length,
        segmentSerial: i++
      };
      const sign = cryptoService.sign(privateKey, data);
      const encData = JSON.stringify(
        cryptoService.encyptAes(selectedUser.aesKey, data)
      );
      if (steganographyIndex === i) {
        cryptoService.steganographyEncode(encData, image).then((res) => {
          const message = {
            senderUsername: user.username,
            receiverUsername: selectedUser.username,
            data: JSON.stringify(res),
            syn: false,
            sendCert: false,
            ackCert: false,
            sendKey: false,
            ackKey: false,
            fin: false,
            image: true,
            sign
          };
          stompClient.send("/acs/message", {}, JSON.stringify(message));
        });
      } else {
        const message = {
          senderUsername: user.username,
          receiverUsername: selectedUser.username,
          data: encData,
          syn: false,
          sendCert: false,
          ackCert: false,
          sendKey: false,
          ackKey: false,
          fin: false,
          image: false,
          sign
        };
        stompClient.send("/acs/message", {}, JSON.stringify(message));
      }
    });
    dispatch(
      addMessage({
        username: selectedUser.username,
        message: {
          content,
          dateTime,
          id,
          sender: user.username
        }
      })
    );
  };

  useEffect(() => {
    if (sendKey) {
      const receiverCert = cryptoService.certificateFromPem(sendKey.data);
      const receiverPubKey = receiverCert.publicKey;
      if (
        receiverCert.verify(receiverCert) &&
        Date.now() > receiverCert.validity.notBefore.getTime() &&
        Date.now() < receiverCert.validity.notAfter.getTime()
      ) {
        const aesKey = cryptoService.createAesKey();
        const aesKeyEnc = cryptoService.encryptWithPublicKey(
          receiverPubKey,
          JSON.stringify(aesKey)
        );
        const msg = {
          senderUsername: user.username,
          receiverUsername: sendKey.senderUsername,
          data: JSON.stringify(aesKeyEnc),
          syn: true,
          sendCert: false,
          ackCert: false,
          sendKey: true,
          ackKey: false,
          fin: false
        };
        stompClient.send("/acs/message", {}, JSON.stringify(msg));
        dispatch(
          addConnectedUser({
            username: sendKey.senderUsername,
            aesKey,
            messages: [],
            pubKey: receiverPubKey
          })
        );
      }
    }
  }, [sendKey]);

  useEffect(() => {
    if (receiveKey) {
      const msg = {
        senderUsername: user.username,
        receiverUsername: receiveKey.senderUsername,
        data: receiveKey.data,
        syn: true,
        sendCert: false,
        ackCert: false,
        sendKey: true,
        ackKey: true,
        fin: false
      };
      stompClient.send("/acs/message", {}, JSON.stringify(msg));
      const pubKey = requests.filter((r) => r.username === receiveKey.senderUsername)[0].cert.publicKey;
      dispatch(
        addConnectedUser({
          username: receiveKey.senderUsername,
          aesKey: JSON.parse(
            cryptoService.decryptWithPrivateKey(
              privateKey,
              JSON.parse(receiveKey.data)
            )
          ),
          messages: [],
          pubKey
        })
      );
    }
  }, [receiveKey]);

  const connect = (receiver) => {
    const message = {
      senderUsername: user.username,
      receiverUsername: receiver.username,
      data: cryptoService.certificateToPem(certificate),
      syn: true,
      sendCert: true,
      ackCert: false,
      sendKey: false,
      ackKey: false,
      fin: false
    };
    stompClient.send("/acs/message", {}, JSON.stringify(message));
  };

  const accept = (receiver) => {
    const message = {
      senderUsername: user.username,
      receiverUsername: receiver.username,
      data: cryptoService.certificateToPem(certificate),
      syn: true,
      sendCert: true,
      ackCert: true,
      sendKey: false,
      ackKey: false,
      fin: false
    };
    stompClient.send("/acs/message", {}, JSON.stringify(message));
  };

  const disconnect = () => {
    if (stompClient) stompClient.disconnect();
  };

  useEffect(() => {
    axios
      .get("/images/chat.jpg", {
        responseType: "blob"
      })
      .then((res) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result);
        };
        reader.readAsDataURL(new Blob([res.data]));
      });

    const sock = new SockJS("https://chat:8080/chat");
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
          }
        } else {
          dispatch(addPart(msg));
        }
      });
    });
    setStompClient(stompClient);
    return disconnect;
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
          <ChatBox username={selectedUser.username} onSend={sendMessage} />
        )}
      </Grid>
    </Grid>
  );
};

export default Home;
