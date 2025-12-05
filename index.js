const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIO = require("socket.io");
const path = require("path");
require("dotenv").config({ 
     path: path.resolve(__dirname, "./.env")
});

const app = express();
const PORT = process.env.PORT || 4000;


// Middlewares
app.use(cors());
app.use(express.json());

// Simple route to test server
app.get("/", (req, res) => {
  res.send("Hello world from socket server!");
});

// Create HTTP server
const server = http.createServer(app);
const io = socketIO(server);

let users = [];

// Add user to array
const addUser = (userId, socketId) => {
  if (!users.some((user) => user.userId === userId)) {
    users.push({ userId, socketId });
  }
};

// Remove user from array
const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

// Get user by id
const getUser = (userId) => users.find((user) => user.userId === userId);

// Socket connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Add user
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  // Send message
  const messages = {};

  socket.on("sendMessage", ({ senderId, receiverId, text, images }) => {
    const message = { senderId, receiverId, text, images, seen: false };

    if (!messages[receiverId]) messages[receiverId] = [];
    messages[receiverId].push(message);

    const user = getUser(receiverId);
    if (user) io.to(user.socketId).emit("getMessage", message);
  });

  // Message seen
  socket.on("messageSeen", ({ senderId, receiverId, messageId }) => {
    const user = getUser(senderId);
    if (messages[senderId]) {
      const message = messages[senderId].find(
        (msg) => msg.receiverId === receiverId && msg.id === messageId
      );
      if (message) {
        message.seen = true;
        if (user) {
          io.to(user.socketId).emit("messageSeen", { senderId, receiverId, messageId });
        }
      }
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Socket server running on http://localhost:${PORT}`);
});