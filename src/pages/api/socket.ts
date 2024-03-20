import { Server, type Socket } from "socket.io";

import type { NextApiRequest } from "next";
import type { NextApiResponseServerIO } from "~/types/next";

function onConnection(socket: Socket) {
  console.log("on server connection", socket.id);
  // temp connection logic
  socket.on("hello", (args) => {
    console.log(args);
  });

  socket.on("message", (msg) => {
    console.log("emit msg from server:", msg);
    socket.broadcast.emit("message", msg);
  });
}

export default function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO,
) {
  // means that socket server was already initialised
  if (res.socket.server.io) {
    res.end();
    return;
  }
  console.log("Creating a socketIO Server");
  // @ts-expect-error this server pattern from example and not sure how to dig into this deep of types to fix
  const io = new Server(res.socket.server, {
    path: "/api/socket",
  });
  res.socket.server.io = io;

  io.on("connection", onConnection);

  res.end();
}
