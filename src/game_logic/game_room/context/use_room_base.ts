"use client";

import { useState, useEffect } from "react";
import type { ClientSocketType } from "~/socket_io/socket_types";
import type { GameRoomDataI } from "../room_types";

export interface RoomBaseI {
  room: GameRoomDataI | undefined;
  setRoom: React.Dispatch<React.SetStateAction<GameRoomDataI | undefined>>;
}

// this will just add and do basic room stuff, will add chat/game logic on top elsewhere
export default function useRoomBase(socket: ClientSocketType) {
  const [room, setRoom] = useState<GameRoomDataI>();

  useEffect(() => {
    socket.on("room_info", (data) => {
      // use room update, verify there isn't a room already stored (if user is using multiple tabs for multiple games)
      setRoom((current) => {
        // if there is a room, default to keeping it unchanged. However if it matches the new roomId, assume this data is valid and use it just in case
        // return current.roomId current?.roomId !== data.roomId ? current : data;
        return !current?.roomId || current?.roomId === data.roomId
          ? data
          : current;
      });
    });

    socket.on("leave_room", (roomId) => {
      setRoom((current) => {
        // check if closed room is one we are in, leave room if so
        return current?.roomId === roomId ? undefined : current;
      });
    });

    socket.on("players_update", (roomId, playerData) => {
      setRoom((current) => {
        if (current?.roomId === roomId) {
          return {
            ...current,
            ...playerData,
          };
        }
        return current;
      });
    });

    // cleanup remove listeners
    return () => {
      socket.off("room_info");
      socket.off("leave_room");
      socket.off("players_update");
    };
  }, []);

  return {
    room,
    setRoom,
  };
}
