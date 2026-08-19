import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

const userSocketMap = {};

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId & (userId != undefined)) {
    userSocketMap[userId] = socket.id;
    console.log(`A user connected: socketId: ${socket.id}, userId: ${userId}`);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`User ${userId} joined room/chat: ${room}`);
  });

  socket.on("typing", (room) => {
    socket.to(room).emit("typing", room);
  });

  socket.on("stop typing", (room) => {
    socket.to(room).emit("stop typing", room);
  });

  socket.on("message read", ({ chatId, userId: readingUserId }) => {
    socket.to(chatId).emit("message read", { chatId, userId: readingUserId });
  });

  socket.on("new message notify", (message) => {
    const chat = message.chat;
    if (!chat && !chat.participants) {
      return;
    }

    chat.participants.forEach((user) => {
      if (user._id === message.sender._id) return;

      const receiverSocketId=getReceiverSocketId(user._id)
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit('message received notification',message)
      }
    });
  });

  socket.on("disconnect",()=>{
    if (userId) {
        delete userSocketMap[userId];
        console.log(`User disconnected: socketId: ${socket.id}, userId: ${userId}`);
    }
    io.emit("getOnlineUsers",Object.keys(userSocketMap))
  })
});

export { app, server, io };
