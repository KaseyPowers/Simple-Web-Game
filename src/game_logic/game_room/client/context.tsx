"use client";

import { createContext, useContext, useMemo } from "react";
import { useSocket } from "~/socket_io/client_utils";
import useGameRoom, { type UseGameRoomI } from "./use_room";
import useChat, { type UseChatI } from "./use_chat";

export interface GameRoomContextI extends UseGameRoomI, UseChatI {
  loading: boolean;
}

const GameRoomContext = createContext<GameRoomContextI | null>(null);

export function useGameRoomCtx(): GameRoomContextI {
  const gameRoomCtx = useContext(GameRoomContext);

  if (!gameRoomCtx) {
    throw new Error("useGameRoomCtx must be used within GameRoomProvider");
  }
  return gameRoomCtx;
}

export function GameRoomProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string;
}) {
  // hook to make sure socket is connected with userId
  useSocket(userId);
  const gameRoomValues = useGameRoom();

  const { roomId, setRoom } = gameRoomValues;
  const chatValues = useChat({ userId, roomId, setRoom });

  // room is loading if either the room or userId is not defined yet
  const loading = useMemo(() => !(userId && roomId), [userId, roomId]);

  const value: GameRoomContextI = {
    ...gameRoomValues,
    ...chatValues,
    loading,
  };

  return (
    <GameRoomContext.Provider value={value}>
      {children}
    </GameRoomContext.Provider>
  );
}
