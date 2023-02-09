import { SendOutlined } from "@mui/icons-material";
import {
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useState } from "react";
import PropTypes from "prop-types";
import { createSelector } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import moment from "moment";

const ChatBox = (props) => {
  const { username, onSend } = props;
  const [content, setContent] = useState("");

  const selector = createSelector(
    (state) => state.chat,
    (chat) => chat.connectedUsers.filter((u) => u.username === username)[0]?.messages
  );
  const messages = useSelector(selector);

  return (
    <Box sx={{ pr: 4 }}>
      <Typography
        variant="h5"
        sx={{ textAlign: "center", m: 0, mt: 1, height: "20px" }}
      >
        Chat with {username}
      </Typography>
      <Box
        sx={{
          border: 1,
          borderColor: "inherit",
          borderRadius: 1,
          mt: "20px",
          height: "70vh",
          overflow: "auto"
        }}
      >
        <List>
          {messages?.map((m) => (
            <ListItem key={m.id}>
              <ListItemText primary={m.content} secondary={moment(m.dateTime).format("DD. MM. yyyy. HH:mm:ss")} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box
        component="form"
        method="post"
        onSubmit={(e) => {
          e.preventDefault();
          onSend(content);
        }}
        sx={{
          m: 0,
          mt: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <Grid container>
          <Grid item xs={10}>
            <TextField
              required
              fullWidth
              label="Message"
              name="content"
              autoComplete="off"
              multiline
              minRows={1}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              type="submit"
              variant="outlined"
              sx={{ mt: 1.2, ml: 1 }}
              color="inherit"
              endIcon={<SendOutlined />}
            >
              Send
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

ChatBox.propTypes = {
  username: PropTypes.string,
  onSend: PropTypes.func
};

export default ChatBox;
