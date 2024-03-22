"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";

import type { Session } from "next-auth";

import type { ClientSocketType } from "~/types/socket";
import type { GameRoomDataI } from "~/game_logic/room_types";

const socket: ClientSocketType = io({
  path: "/api/socket",
  // autoconnect false to connect in provider logic
  autoConnect: false,
});

type RoomStateType = GameRoomDataI | null;

interface ISocketContext {
  socket: ClientSocketType;
  userId: string;
  room: RoomStateType;
  setRoom: React.Dispatch<React.SetStateAction<RoomStateType>>;
}

const SocketIOContext = createContext<ISocketContext | null>(null);

export function useSocketContext(): ISocketContext {
  const socketContext = useContext(SocketIOContext);

  if (!socketContext) {
    throw new Error("useSocketContext must be used within <SocketIOProvider>");
  }

  return socketContext;
}

export function SocketIOProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const router = useRouter();
  const [room, setRoom] = useState<RoomStateType>(null);

  useEffect(() => {
    void fetch("/api/socket");
  }, []);

  // navigate on change to roomId
  // TODO: Verify the router doesn't change on navigation, otherwise this could be triggered a lot
  useEffect(() => {
    console.log(`New Room Id: ${room?.roomId}`);
    router.push(`/${room?.roomId ?? ""}`);
  }, [router, room?.roomId]);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) {
      // waiting for a userID
      return;
    }
    socket.auth = { userId };
    socket.connect();

    // add socket listeners potentially

    socket.on("connect", () => {
      console.log("Socket Connected: ", socket.id);
    });

    socket.on("roomInfo", (data) => {
      // use room update, verify there isn't a room already stored (if user is using multiple tabs for multiple games)
      setRoom((current) => {
        // if there is a room, default to keeping it unchanged. However if it matches the new roomId, assume this data is valid and use it just in case
        return current && current.roomId !== data.roomId ? current : data;
      });
    });

    socket.on("room_closed", (roomId) => {
      setRoom((current) => {
        // check if closed room is one we are in, leave room if so
        return current?.roomId === roomId ? null : current;
      });
    });

    socket.on("players_update", (roomId, players) => {
      setRoom((current) => {
        if (current?.roomId === roomId) {
          return {
            ...current,
            players,
          };
        }
        return current;
      });
    });

    socket.on("message", (msg) => {
      setRoom((current) => {
        // verify the msg is for the current room, assume player is valid
        if (current?.roomId === msg.roomId) {
          return {
            ...current,
            chat: [...current.chat, msg],
          };
        }
        return current;
      });
    });

    // cleanup
    return () => {
      socket.disconnect();
      socket.off("connect");
      socket.off("roomInfo");
      socket.off("room_closed");
      socket.off("players_update");
      socket.off("message");
    };
  }, [userId]);

  // wait until userId defined before rendering more
  return !userId ? null : (
    <SocketIOContext.Provider value={{ socket, room, userId, setRoom }}>
      {children}
    </SocketIOContext.Provider>
  );
}
