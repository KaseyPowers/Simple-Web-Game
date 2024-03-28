import type {
  ErrorAcknowledgementCallback,
  EventsWithErrorAck,
} from "../util_types";

export interface ChatDataI {
  roomId: string;
  userId: string;
  msg: string;
}

export interface PlayerDataI {
  players: string[];
  playersOnline: Record<string, boolean>;
}

// all data to sync the client to server
export interface GameRoomDataI extends PlayerDataI {
  roomId: string;
  chat: ChatDataI[];
}

interface SharedEvents {
  /** Message works both ways, from sender and then to propogate to the rest of the room */
  message: (msg: ChatDataI) => void;
  /** Leave room:
   * Client->Server: informing room that user is leaving the room by choice
   * Server->Client: informing client that user is leaving a room.
   * - Right now this would only happen if user left room with multiple tabs open so all tabs will leave.
   * - Potential other uses would be if a user get's kicked out of the room by some means.
   *
   */
  leave_room: (roomId: string) => void;
}

export interface RoomServerToClientEvents extends SharedEvents {
  room_info: (data: GameRoomDataI) => void;
  players_update: (roomId: string, players: PlayerDataI) => void;
}

export interface RoomClientToServerEvents
  extends EventsWithErrorAck<SharedEvents> {
  // room events
  create_room: () => void;
  // join_room has a callback on if it's a valid room, still rely on room_info for data object
  join_room: (roomId: string, callback: ErrorAcknowledgementCallback) => void;
}

export interface RoomSocketData {
  roomId?: string;
}
