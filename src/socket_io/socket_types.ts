import type { Server as NetServer, Socket } from "net";
import type { NextApiResponse } from "next";
import type {
  Server as SocketIOServer,
  Socket as ServerSocket,
  RemoteSocket,
} from "socket.io";
import type { Socket as ClientSocket } from "socket.io-client";

import type { ServerEventTypes as GameRoomEventTypes } from "~/game_logic/game_room/socket/socket_types";

export type ServerToClientEvents = GameRoomEventTypes["ServerToClientEvents"];

export type ClientToServerEvents = GameRoomEventTypes["ClientToServerEvents"];

interface InterServerEvents {
  // example fn here until we need a real one
  ping: () => void;
}

type SocketData = {
  userId: string;
} & GameRoomEventTypes["SocketData"];

export type ServerType = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
export type ServerSocketType = ServerSocket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type RemoteSocketType = RemoteSocket<ServerToClientEvents, SocketData>;

export type ClientSocketType = ClientSocket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: ServerType;
    };
  };
};
