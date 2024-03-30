import type { Server as NetServer, Socket } from "net";
import type { NextApiResponse } from "next";
import type {
  Server as SocketIOServer,
  Socket as ServerSocket,
  RemoteSocket,
} from "socket.io";
import type { Socket as ClientSocket } from "socket.io-client";

import type { ServerToClientEvents as PlayerServerToClientEvents } from "./players";
import type {
  SocketData as GameRoomSocketData,
  ServerToClientEvents as GameRoomServerToClientEvents,
  ClientToServerEvents as GameRoomClientToServerEvents,
} from "./game_room";

type ServerToClientEvents = PlayerServerToClientEvents &
  GameRoomServerToClientEvents;

type ClientToServerEvents = GameRoomClientToServerEvents;

interface InterServerEvents {
  // example fn here until we need a real one
  ping: () => void;
}

type SocketData = GameRoomSocketData & {
  userId: string;
};

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

export interface ServerHelperUtilArgs {
  io: ServerType;
  socket: ServerSocketType;
}

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: ServerType;
    };
  };
};
