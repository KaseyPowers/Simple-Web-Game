export interface ChatDataI {
  roomId: string;
  userId: string;
  msg: string;
}

// all data to sync the client to server
export interface GameRoomDataI {
  roomId: string;
  players: string[];
  chat: ChatDataI[];
}

export interface RoomServerToClientEvents {
  // room joining event
  roomInfo: (data: GameRoomDataI) => void;
  // room events
  message: (msg: ChatDataI) => void;
  room_closed: (roomId: string) => void;
  players_update: (roomId: string, players: string[]) => void;
}

export interface RoomClientToServerEvents {
  // room events
  create_room: () => void;
  join_room: (roomId: string) => void;
  leave_room: (roomId: string) => void;
  message: (msg: ChatDataI) => void;
}
