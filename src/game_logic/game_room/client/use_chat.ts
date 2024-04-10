"use client";

import { useCallback, useMemo } from "react";
import { useSocketListener, socketEmit } from "~/socket_io/client_utils";

import type { ChatInputI } from "~/game_logic/game_room/core/types";
import { getChatFromInput } from "~/game_logic/game_room/core/chat";

import type { SetRoomType } from "./use_room";

// hook will add the chat related function and socket listener
export interface UseChatOptions {
  userId?: string;
  roomId?: string;
  setRoom: SetRoomType;
}

export interface UseChatI {
  sendMsg?: (message: string) => Promise<void>;
}

export default function useChat({
  userId,
  roomId,
  setRoom,
}: UseChatOptions): UseChatI {
  const addMsg = useCallback(
    (msg: ChatInputI) => {
      setRoom((currentRoom) => {
        // no room yet, so return unchanged
        if (!currentRoom) {
          return currentRoom;
        }
        // verify this chat is meant for this room, otherwise ignore
        if (currentRoom.roomId !== msg.roomId) {
          console.warn(
            `Received a chat msg for a room different than the current one: msg's room ${msg.roomId} - current game Room's ID ${currentRoom.roomId}`,
          );

          return currentRoom;
        }

        return {
          ...currentRoom,
          chat: [...currentRoom.chat, getChatFromInput(msg)],
        };
      });
    },
    [setRoom],
  );

  const sendMsg = useMemo(() => {
    if (!userId || !roomId) {
      return;
    }

    return async (msg: string) => {
      const messageToSend: ChatInputI = {
        userId,
        roomId,
        msg,
      };
      // TODO: Handle errors?
      await socketEmit("message", messageToSend);
      // wait to add until after it's acknowledged
      addMsg(messageToSend);
    };
  }, [roomId, userId, addMsg]);

  // this handles adding/removing socket listeners for us
  useSocketListener("message", addMsg);

  return {
    sendMsg,
  };
}
