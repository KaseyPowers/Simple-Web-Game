"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

import type { ClientSocketType } from "~/socket_io/socket_types";
import useSocket from "~/socket_io/use_socket";

import type { GameRoomDataI } from "../room_types";
import useRoomBase from "./use_room_base";
import useChat, { type sendMsgFn } from "./use_chat";

/**
 * root context for game_room instances from the client
 */

interface IGameRoomContext {
  socket: ClientSocketType;
  // can use a string for loading message if we get fancy
  loading: boolean | string;
  room: GameRoomDataI | undefined;
  // err message if there is one
  roomErr?: string;
  setRoom: React.Dispatch<React.SetStateAction<GameRoomDataI | undefined>>;
  sendMsg: sendMsgFn;
}

const GameRoomContext = createContext<IGameRoomContext | null>(null);

export function useGameRoom(): IGameRoomContext {
  const gameRoomCtx = useContext(GameRoomContext);

  if (!gameRoomCtx) {
    throw new Error("useSocketContext must be used within <SocketIOProvider>");
  }

  return gameRoomCtx;
}

export function GameRoomProvider({ children }: { children: React.ReactNode }) {
  // get session data
  const session = useSession();
  const userId = session?.data?.user?.id;
  const socket = useSocket(userId);
  const { room, setRoom } = useRoomBase(socket);
  const { sendMsg } = useChat({
    socket,
    userId,
    room,
    setRoom,
  });

  /** Logic for navigating and joining rooms */
  const router = useRouter();
  const params: { roomId?: string } | null = useParams();
  // use a tuple, first string is the roomId to check for changes, second string is the error
  const [roomErr, setRoomErr] = useState<[string, string]>();
  useEffect(() => {
    const paramId = params?.roomId;
    const dataId = room?.roomId;
    const errorId = roomErr?.[0];
    // if there is a roomErr but it's ID doesn't match the param, clear the error
    if (errorId && errorId !== paramId) {
      setRoomErr(undefined);
    }
    /**
     * if there is a param and it doesn't match the room data. assume we need to try joining the room.
     * if creating a room and so going from expected null room, that will only happen when there is no paramId
     */
    if (paramId && paramId !== dataId) {
      console.log(
        `paramID found, but doesn't match the dataId, will try joining`,
      );
      socket.emit("join_room", paramId, (response) => {
        // if the response is a string, thats an error/msg about something preventing joining. so will navigate back to landing page with an alert.
        if (typeof response === "string") {
          // don't love using this alert but good starting point.
          // need to confirm navigatin won't remove it.
          setRoomErr([paramId, response]);
          setRoom(undefined);
        }
        // otherwise expect join to have worked out and will get the dataId to match soon
      });
    }
    // if no param found, and a roomId is, assume we should navigate to it
    if (!paramId && dataId) {
      console.log(
        `dataId added, and no paramId, will navigate to page: ${dataId}`,
      );
      router.push(`/${dataId}`);
    }
  }, [
    socket,
    router,
    params?.roomId,
    room?.roomId,
    roomErr,
    setRoomErr,
    setRoom,
  ]);

  const hasRoom = !!room;
  // socket loading state true if waiting on userId or room hasn't joined yet
  const loading = useMemo(() => !userId || !hasRoom, [userId, hasRoom]);

  return (
    <GameRoomContext.Provider
      value={{ socket, room, setRoom, loading, roomErr: roomErr?.[0], sendMsg }}
    >
      {children}
    </GameRoomContext.Provider>
  );
}
