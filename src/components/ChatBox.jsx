import { SendOutlined } from "@mui/icons-material";
import { Button, Grid, TextField, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React, { useState } from "react";

const ChatBox = () => {
  const [content, setContent] = useState("");

  const create = () => {

  };

  return (
    <Box sx={{ pr: 4 }}>
        <Typography variant="h5" sx={{ textAlign: "center", m: 0, mt: 1, height: "20px" }}>
          Korisnik
        </Typography>
      <Box sx={{ border: 1, borderColor: "inherit", borderRadius: 1, mt: "20px", minHeight: "70vh" }}></Box>
      <Box
        component="form"
        method="post"
        onSubmit={create}
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
              onChange={(event) => setContent(event.target.value)} />
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

export default ChatBox;
