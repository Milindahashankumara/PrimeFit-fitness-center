const { Server } = require("socket.io");

let io;

const getCorsOrigins = () => {
  const corsOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return corsOrigins.length > 0
    ? corsOrigins
    : ["http://localhost:3000", "http://127.0.0.1:3000"];
};

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: getCorsOrigins(),
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("register", (userId) => {
      if (userId) {
        socket.join(String(userId));
        socket.data.userId = String(userId);
      }
    });

    socket.on("disconnect", () => {
      socket.leave(socket.data.userId);
    });
  });

  return io;
};

const emitToUser = (userId, eventName, payload) => {
  if (!io || !userId) return;
  io.to(String(userId)).emit(eventName, payload);
};

module.exports = {
  initializeSocket,
  emitToUser,
};