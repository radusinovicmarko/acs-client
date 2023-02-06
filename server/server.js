const https = require("https");
const fs = require("fs");
const express = require("express");
const httpProxyMiddleware = require("http-proxy-middleware");

const app = express();

// Serve your React app using proxy middleware
const targetUrl = "https://localhost:3000";
app.use("/", httpProxyMiddleware({ target: targetUrl, changeOrigin: true }));

// Load the SSL certificate and key
const options = {
  cert: fs.readFileSync("server-cert.pem"),
  key: fs.readFileSync("server-key.pem")
};

// Create the HTTPS server
const server = https.createServer(options, app);

// Start the server
server.listen(3000, () => {
  console.log("HTTPS server listening on port 3000");
});
