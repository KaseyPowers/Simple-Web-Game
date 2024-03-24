"use client";

import { useEffect, useCallback, useMemo } from "react";
import type { ClientSocketType } from "~/utils/socket_types";
import type { ChatDataI } from "../room_types";

import type { RoomBaseI } from "./use_room_base";

export type sendMsgFn = undefined | ((text: string) => void);
// this will just add and do basic room stuff, will add chat/game logic on top elsewhere
export default function useChat({
  socket,
  userId,
  room,
  setRoom,
}: { socket: ClientSocketType; userId?: string } & RoomBaseI) {
  const _addMsg = useCallback(
    (msg: ChatDataI) => {
      setRoom((currentRoom) => {
        // validate message, and skip updates if not a valid message
        // NOTE: Could validate the player userId in room but not sure if neccisary
        if (!currentRoom || currentRoom.roomId !== msg.roomId) {
          return currentRoom;
        }
        return {
          ...currentRoom,
          chat: [...currentRoom.chat, msg],
        };
      });
    },
    [setRoom],
  );

  const roomId = room?.roomId;
  const sendMsg: sendMsgFn = useMemo(() => {
    // return nothing if missing data needed to send
    if (!userId || !roomId) {
      return;
    }
    return (text: string) => {
      const msg: ChatDataI = {
        userId,
        roomId,
        msg: text,
      };
      socket.emit("message", msg);
      _addMsg(msg);
    };
  }, [socket, userId, roomId, _addMsg]);

  // add listener for new messages
  useEffect(() => {
    socket.on("message", _addMsg);
    // cleanup remove listeners
    return () => {
      socket.off("message");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sendMsg,
  };
}
