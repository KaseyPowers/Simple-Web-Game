import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

import dotenv from "dotenv";

dotenv.config();


let port = 3001;
if (process.env.PORT) {
    port = parseInt(process.env.PORT);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3002"
    }
});

io.on("connection", (socket) => {
    console.log(socket.id); // ojIckSD2jqNzOqIrAGzL
});

io.listen(port);

// httpServer.listen(port, function () {
//     console.log('listening on *:' + port);
// });