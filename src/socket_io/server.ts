import { Server } from "socket.io";

import type { Server as NetServer } from "net";
import type { ServerType, ServerSocketType } from "./socket_types";

import { roomHandlers } from "~/game_logic/game_room/room_handlers";

import { socketPath } from "./socket_configs";

// split functions to help with testing
export function getSocketServer(netServer: NetServer): ServerType {
  // @ts-expect-error this server pattern from example and not sure how to dig into this deep of types to fix
  const io: ServerType = new Server(netServer, {
    path: socketPath,
  });

  // have the userID logic always on, but just verify that it exists.
  // NOTE: might want to add a check against the database stuff to verify userIDs?
  io.use((socket, next) => {
    console.log("checking for userID");
    const userId: false | string =
      typeof socket.handshake.auth.userId === "string" &&
      socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error("Missing UserId"));
    }
    socket.data.userId = userId;
    next();
  });

  return io;
}

export function addSocketHandlers(io: ServerType) {
  const onConnection = (socket: ServerSocketType) => {
    // const session = await getServerAuthSession();
    // console.log("Has session? : ", session);
    console.log("on server connection", socket.data.userId);

    // join room for userId to track if on multiple tabs
    void socket.join(socket.data.userId);

    roomHandlers(io, socket);
  };

  io.on("connection", onConnection);
}

export default function buildServerSocket(netServer: NetServer) {
  const io = getSocketServer(netServer);
  addSocketHandlers(io);
  return io;
}
