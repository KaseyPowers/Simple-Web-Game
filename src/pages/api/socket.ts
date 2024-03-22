import { Server } from "socket.io";

// import { getServerAuthSession } from "~/server/auth";

import type { NextApiRequest } from "next";
import type { NextApiResponseServerIO } from "~/types/next";

import type { ServerType, ServerSocketType } from "~/types/socket";

function onConnection(socket: ServerSocketType) {
  // const session = await getServerAuthSession();
  // console.log("Has session? : ", session);
  console.log("on server connection", socket.data.userId);

  // join room for userId to track if on multiple tabs
  void socket.join(socket.data.userId);

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
  const io: ServerType = new Server(res.socket.server, {
    path: "/api/socket",
  });
  io.use((socket, next) => {
    const userId: false | string =
      typeof socket.handshake.auth.userId === "string" &&
      socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error("Missing UserId"));
    }
    socket.data.userId = userId;
    next();
  });
  res.socket.server.io = io;

  io.on("connection", onConnection);

  res.end();
}
