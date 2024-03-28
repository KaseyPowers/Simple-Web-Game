import type { Server as NetServer, Socket } from "net";
import type { NextApiResponse } from "next";
import type {
  Server as SocketIOServer,
  Socket as ServerSocket,
} from "socket.io";
import type { Socket as ClientSocket } from "socket.io-client";

import type {
  RoomServerToClientEvents,
  RoomClientToServerEvents,
  RoomSocketData,
} from "../game_room/room_types";

type ServerToClientEvents = RoomServerToClientEvents;

type ClientToServerEvents = RoomClientToServerEvents;

interface InterServerEvents {
  // example fn here until we need a real one
  ping: () => void;
}

type SocketData = RoomSocketData & {
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
