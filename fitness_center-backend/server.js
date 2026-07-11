const dotenv = require("dotenv");
dotenv.config(); // MUST be first — loads env vars before any other module reads them

const http = require("http");
const connectDB = require("./config/db");
const app = require("./app");
const { initializeSocket } = require("./services/socket");

connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
