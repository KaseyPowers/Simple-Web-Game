"use client";

import type React from "react";
import { useState, useCallback, useMemo } from "react";
import { useSocketListener, socketEmitBase } from "~/socket_io/client_utils";

import type { GameRoomI } from "../core/room";
import type { GameRoomPlayersI } from "../core/players";

export type RoomContextType = GameRoomI | undefined;
export type SetRoomType = React.Dispatch<React.SetStateAction<RoomContextType>>;
export type RoomErrorType = [roomId: string, errorMsg: string] | undefined;

export interface UseGameRoomI {
  room: RoomContextType;
  roomId: string | undefined;
  setRoom: SetRoomType;
  roomErr: RoomErrorType;
  joinRoom: (joinRoomId?: string) => Promise<void>;
}

export default function useGameRoom(): UseGameRoomI {
  const [room, setRoom] = useState<RoomContextType>();
  const roomId = useMemo(() => room?.roomId, [room]);

  const onRoomInfo = useCallback(
    (newRoom: GameRoomI) => {
      setRoom((currentRoom) => {
        // if there is a room, default to keeping it unchanged. However if it matches the new roomId, assume this data is valid and use it just in case
        // return currentRoom.roomId currentRoom?.roomId !== newRoom.roomId ? currentRoom : newRoom;
        return !currentRoom?.roomId || currentRoom?.roomId === newRoom.roomId
          ? newRoom
          : currentRoom;
      });
    },
    [setRoom],
  );

  const onLeaveRoom = useCallback(
    (roomId: string) => {
      setRoom((current) => {
        // if called to leave the current room's roomId, return undefined. Otherwise no changes
        return current?.roomId === roomId ? undefined : current;
      });
    },
    [setRoom],
  );

  const onPlayersUpdate = useCallback(
    (roomId: string, playerData: GameRoomPlayersI) => {
      setRoom((currentRoom) => {
        if (currentRoom?.roomId === roomId) {
          return {
            ...currentRoom,
            ...playerData,
          };
        }
        return currentRoom;
      });
    },
    [setRoom],
  );

  // add the listeners for each function
  useSocketListener("room_info", onRoomInfo);
  useSocketListener("leave_room", onLeaveRoom);
  useSocketListener("players_update", onPlayersUpdate);

  const [roomErr, setRoomErr] = useState<RoomErrorType>();

  const joinRoom = useCallback(
    async (joinRoomId?: string) => {
      // whenever joining a room, assume we can reset the error state
      setRoomErr(undefined);
      // if undefined, assume going to a no-room state
      // we could call a leave_room event here, but that would kick all tabs out of room which would require a different function call
      if (!joinRoomId) {
        setRoom(undefined);
        return;
      }
      // if called with the current room, should return (since we already reset the errors)
      if (joinRoomId === roomId) {
        return;
      }
      // to hit this, would need both to be defined but not matching. This shouldn't happen but will just do a warning not an error
      if (joinRoomId && roomId) {
        console.warn(
          `JoinRoom was called to join ${joinRoomId} when already have a roomId defiend: ${roomId}. This shouldn't be possible`,
        );
      }

      // call emit without it throwing an error so we can use the response's error message directly
      const response = await socketEmitBase("join_room", joinRoomId);

      if (response?.error) {
        // if an error, get rid of the room data?
        setRoom(undefined);
        setRoomErr([joinRoomId, response.error.message]);
      }
      /**
       * Else - join_room success
       * - error was already cleared out
       * - don't need to modify the room obj since we can expect a `room_info` event to come with the data
       */
    },
    [roomId, setRoomErr, setRoom],
  );

  return {
    room,
    roomId,
    setRoom,
    roomErr,
    joinRoom,
  };
}
