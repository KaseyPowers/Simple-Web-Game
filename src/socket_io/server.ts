import { Server } from "socket.io";

import type { Server as NetServer } from "net";

import { roomHandlers } from "../game_logic/game_room/room_handlers";

import socketRoomUtils from "./room_utils";
import type { handlersFunction } from "./socket_util_types";
import type { ServerType, ServerSocketType } from "./socket_types";
import { socketPath } from "./socket_configs";

export function getSocketServer(
  netServer: NetServer,
  handlerFn: handlersFunction,
): ServerType {
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
    next();
  });

  // connection handling function
  const onConnection = (socket: ServerSocketType) => {
    // doing this in connection to verify that the room is joined even on reconnection
    void socketRoomUtils.joinUserIdRoom(socket, socket.data.userId);
    handlerFn({
      io,
      socket,
    });
  };
  io.on("connection", onConnection);

  return io;
}

// // wrap the basic function and provide the actual handlers function used for app
export default function buildServerSocket(netServer: NetServer): ServerType {
  return getSocketServer(netServer, ({ io, socket }) => {
    roomHandlers(io, socket);
  });
}
