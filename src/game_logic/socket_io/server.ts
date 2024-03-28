import { Server } from "socket.io";

import type { Server as NetServer } from "net";

import { roomHandlers } from "../game_room/room_handlers";

import type { ServerType, ServerSocketType } from "./socket_types";
import { socketPath } from "./socket_configs";

export function getSocketServer(netServer: NetServer): ServerType {
  // @ts-expect-error this server pattern from example and not sure how to dig into this deep of types to fix
  const io: ServerType = new Server(netServer, {
    path: socketPath,
  });

  // have the userID logic always on, but just verify that it exists.
  // NOTE: might want to add a check against the database stuff to verify userIDs?
  io.use((socket, next) => {
    const userId: false | string =
      typeof socket.handshake.auth.userId === "string" &&
      socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error("Missing UserId"));
    }
    socket.data.userId = userId;
    /**
     * NOTE/TODO: all examples show this sort of join in the `io.on("connection"` callback listener, but it makes sense to me to put it here?
     * Will need to keep an eye on this if it becomes an issue
     */
    void socket.join(userId);
    next();
  });

  return io;
}

export default function buildServerSocket(netServer: NetServer): ServerType {
  const io = getSocketServer(netServer);

  const onConnection = (socket: ServerSocketType) => {
    roomHandlers(io, socket);
  };

  io.on("connection", onConnection);
  return io;
}
