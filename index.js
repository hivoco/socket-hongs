const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:8081",
    methods: ["GET", "POST"],
  },
});

const userSockets = {}; // Map store_id to socket ID

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Register the user with email
  socket.on("register_user", (store_id, counter) => {
    userSockets[store_id + counter] = socket.id; // Map store_id to the socket ID
    console.log(
      `User registered: ${store_id + counter} with socket ID: ${socket.id}`
    );
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const store_id = Object.keys(userSockets).find(
      (key) => userSockets[key] === socket.id
    );
    if (store_id) {
      delete userSockets[store_id];
      console.log(`User disconnected: ${store_id}`);
    }
  });
});

// Trigger mic on for a specific store_id
app.post("/trigger-mic-on", (req, res) => {
  const { store_id, counter } = req.body;
  if (userSockets[store_id + counter]) {
    io.to(userSockets[store_id + counter]).emit(
      "mic_on",
      "Start mic for this user"
    );
    res.send(`Mic turned on for ${store_id} and Counter ${counter}`);
  } else {
    res.status(404).send("User not connected");
  }
});

// Trigger mic off for a specific store_id
app.post("/trigger-mic-off", (req, res) => {
  const { store_id, counter } = req.body;
  if (userSockets[store_id + counter]) {
    io.to(userSockets[store_id + counter]).emit(
      "mic_off",
      "Stop mic for this user"
    );
    res.send(`Mic turned off for ${store_id} and Counter ${counter}`);
  } else {
    res.status(404).send("User not connected");
  }
});

server.listen(8101, () => {
  console.log("SERVER IS RUNNING");
});
