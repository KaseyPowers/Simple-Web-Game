import type { Server, Socket as ServerSocket } from "socket.io";

import type { Socket as ClientSocket } from "socket.io-client";

import type {
  RoomServerToClientEvents,
  RoomClientToServerEvents,
  RoomSocketData,
} from "~/game_logic/room_types";

type ServerToClientEvents = RoomServerToClientEvents;

type ClientToServerEvents = RoomClientToServerEvents;

interface InterServerEvents {
  // example fn here until we need a real one
  ping: () => void;
}

type SocketData = RoomSocketData & {
  userId: string;
};

export type ServerType = Server<
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
