import React, { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { Grid, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { login } from "../redux/slices/userSlice";
import CustomSnackbar from "../components/CustomSnackbar";
import { unwrapResult } from "@reduxjs/toolkit";
import forge from "node-forge";
import { setCertificate } from "../redux/slices/chatSlice";

const Login = () => {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showKeystorePassword, setShowKeystorePassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = () => setShowPassword(!showPassword);
  const handleClickShowKeystorePassword = () =>
    setShowKeystorePassword(!showKeystorePassword);
  const handleMouseDownKeystorePassword = () =>
    setShowKeystorePassword(!showKeystorePassword);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    keystorePassword: ""
  });
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: "",
    type: "error"
  });
  const [certFile] = useState(null);

  useEffect(() => {
    /* window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      localStorage.setItem("aaa", "asfasf");
      e.returnValue = "Are you sure";
    }); */
    if (certFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        // binary data
        const p12Asn1 = forge.asn1.fromDer(e.target.result);
        // decrypt p12 using the password 'password'
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, "sigurnost");
        // console.log(p12);
        const bags = p12.getBags({ friendlyName: "marko12" });
        // console.log(bags);
        // private key
        const key = bags.friendlyName[0].key;
        // console.log(key);
        // cert
        const cert = bags.friendlyName[1];
        // console.log(JSON.stringify(cert));

        const pubKey = cert.cert.publicKey;
        // console.log(pubKey);

        // signature
        const md = forge.md.sha256.create();
        md.update("Hello", "utf8");
        const sign = key.sign(md);

        // verify signature
        const verified = pubKey.verify(md.digest().bytes(), sign);
        console.log(verified);

        // aes 256
        const aesKey = forge.random.getBytesSync(32);
        const aesIv = forge.random.getBytesSync(32);
        const cipher = forge.cipher.createCipher("AES-CBC", aesKey);
        cipher.start({ iv: aesIv });
        cipher.update(forge.util.createBuffer("Hello world!"));
        cipher.finish();
        const encrypted = cipher.output;
        console.log(encrypted);

        const decipher = forge.cipher.createDecipher("AES-CBC", aesKey);
        decipher.start({ iv: aesIv });
        decipher.update(encrypted);
        decipher.finish();
        const decrypted = decipher.output;
        console.log(decrypted);

        console.log(JSON.stringify({ key: aesKey, iv: aesIv }));

        const rsaEncr = pubKey.encrypt(
          JSON.stringify({ key: aesKey, iv: aesIv })
        );
        const rsaDecr = key.decrypt(rsaEncr);
        console.log(rsaDecr);
      };
      reader.readAsBinaryString(certFile);
    }
  }, [certFile]);

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(login(credentials))
      .then(unwrapResult)
      .then((res) => {
        dispatch(
          setCertificate({
            cert: res.certificate,
            password: credentials.keystorePassword,
            cn: res.username
          })
        );
      })
      .catch(() =>
        setSnackbarState({
          open: true,
          message: "Log-In failed.",
          type: "error"
        })
      );
  };

  return (
    <Container component="main">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <Typography component="h1" variant="h4">
          Anonymous Communication System
        </Typography>
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h2" variant="h5">
          Log-In
        </Typography>
        <Box
          component="form"
          method="post"
          onSubmit={handleSubmit}
          sx={{ mt: 1 }}
        >
          <Container maxWidth="xs">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  value={credentials.username}
                  onChange={(event) =>
                    setCredentials({
                      ...credentials,
                      username: event.target.value
                    })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  name="password"
                  label="Password"
                  id="password"
                  autoComplete="off"
                  value={credentials.password}
                  onChange={(event) =>
                    setCredentials({
                      ...credentials,
                      password: event.target.value
                    })
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                        >
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  type={showKeystorePassword ? "text" : "password"}
                  name="keystorePassword"
                  label="Keystore Password"
                  autoComplete="off"
                  value={credentials.keystorePassword}
                  onChange={(event) =>
                    setCredentials({
                      ...credentials,
                      keystorePassword: event.target.value
                    })
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowKeystorePassword}
                          onMouseDown={handleMouseDownKeystorePassword}
                        >
                          {showKeystorePassword
                            ? (
                            <Visibility />
                              )
                            : (
                            <VisibilityOff />
                              )}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                >
                  Log-In
                </Button>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
      <CustomSnackbar
        open={snackbarState.open}
        type={snackbarState.type}
        message={snackbarState.message}
        onClose={() =>
          setSnackbarState({
            ...snackbarState,
            open: false
          })
        }
      />
    </Container>
  );
};

export default Login;
