import { createUpdater } from "./updater";

import { utils as playerUtils } from "./players";

export interface ChatDataI {
  userId: string;
  msg: string;
}

export interface ChatInputI extends ChatDataI {
  roomId: string;
}

export type GameRoomChatType = Readonly<ChatDataI[]>;

export function getChatFromInput(inputMsg: ChatInputI): Readonly<ChatDataI> {
  const { userId, msg } = inputMsg;
  return {
    userId,
    msg,
  };
}

const addChatMessage = createUpdater((room, inputMsg: ChatInputI) => {
  const { roomId, userId } = inputMsg;
  // first validate the roomId from message matches this room
  if (room.roomId !== roomId) {
    throw new Error(
      `Invalid message! Attempted to add a new chat message with roomId ${roomId} to a room with id ${room.roomId}`,
    );
  }
  // now validate the user is actually in the room
  playerUtils.validatePlayerInRoom(room, userId);

  // get the final data object, then add to the room
  const newMsg = getChatFromInput(inputMsg);
  return [
    {
      ...room,
      chat: [...room.chat, newMsg],
    },
    true,
  ];
});

export const updaters = {
  addChatMessage,
} as const;
