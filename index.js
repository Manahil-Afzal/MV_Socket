// const socketIO = require("socket.io");
// const http = require("http");
// const express = require("express");
// const cors = require("cors");
// const app = express();
// const server = http.createServer(app);


// // Configure socket.io with proper CORS
// const io = socketIO(server, {
//   cors: {
//     origin: ["http://localhost:3000", "http://localhost:5173"], 
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
//   transports: ["websocket", "polling"],
// });



// require("dotenv").config({
//   path: "./.env",
// });

// // app.use(cors());
// app.use(cors({ origin: "http://localhost:3000", credentials: true }));
// app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("Hello world from socket server!");
// });

// let users = [];

// const addUser = (userId, socketId) => {
//   !users.some((user) => user.userId === userId) &&
//     users.push({ userId, socketId });
// };

// const removeUser = (socketId) => {
//   users = users.filter((user) => user.socketId !== socketId);
// };

// const getUser = (receiverId) => {
//   return users.find((user) => user.userId === receiverId);
// };

// // Define a message object with a seen property
// const createMessage = ({ senderId, receiverId, text, images }) => ({
//   senderId,
//   receiverId,
//   text,
//   images,
//   seen: false,
// });

// io.on("connection", (socket) => {
//   // when connect
//   console.log(`a user is connected`);

//   // take userId and socketId from user
//   socket.on("addUser", (userId) => {
//     addUser(userId, socket.id);
//     io.emit("getUsers", users);
//   });

//   // send and get message
//   const messages = {}; 

//   socket.on("sendMessage", ({ senderId, receiverId, text, images }) => {
//     const message = createMessage({ senderId, receiverId, text, images });

//     const user = getUser(receiverId);

//     // Store the messages in the `messages` object
//     if (!messages[receiverId]) {
//       messages[receiverId] = [message];
//     } else {
//       messages[receiverId].push(message);
//     }

//     // send the message to the recevier
//     io.to(user?.socketId).emit("getMessage", message);
//   });

//   socket.on("messageSeen", ({ senderId, receiverId, messageId }) => {
//     const user = getUser(senderId);

//     // update the seen flag for the message
//     if (messages[senderId]) {
//       const message = messages[senderId].find(
//         (message) =>
//           message.receiverId === receiverId && message.id === messageId
//       );
//       if (message) {
//         message.seen = true;

//         // send a message seen event to the sender
//         io.to(user?.socketId).emit("messageSeen", {
//           senderId,
//           receiverId,
//           messageId,
//         });
//       }
//     }
//   });

//   // update and get last message
//   socket.on("updateLastMessage", ({ lastMessage, lastMessagesId }) => {
//     io.emit("getLastMessage", {
//       lastMessage,
//       lastMessagesId,
//     });
//   });

//   //when disconnect
//   socket.on("disconnect", () => {
//     console.log(`a user disconnected!`);
//     removeUser(socket.id);
//     io.emit("getUsers", users);
//   });
// });

// server.listen(process.env.PORT || 4000, () => {
//   console.log(`server is running on port ${process.env.PORT || 4000}`);
// });




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