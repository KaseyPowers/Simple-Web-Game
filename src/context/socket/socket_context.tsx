"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { type Socket, io } from "socket.io-client";

import type { Session } from "next-auth";
import type { ClientSocketType } from "~/types/socket";

export const socket: ClientSocketType = io({
  path: "/api/socket",
  // autoconnect false to connect in provider logic
  autoConnect: false,
});

interface IChatMsg {
  user: string;
  msg: string;
}

interface ISocketContext {
  chat: IChatMsg[];
  socket: Socket;
  sendMsg: (msg: string) => void;
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
  // Temp chat logic for learning sockets
  const [chat, setChat] = useState<IChatMsg[]>([]);

  useEffect((): void => {
    void fetch("/api/socket");
  }, []);

  const userId = session?.user.id;

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

    socket.on("message", (message: IChatMsg) => {
      setChat((current) => [...current, message]);
    });

    // cleanup
    return () => {
      socket.disconnect();
      socket.off("connect");
      socket.off("message");
    };
  }, [userId]);

  const sendMsg = (msg: string) => {
    const msgObj: IChatMsg = {
      user: session?.user?.name ?? "Missing User?",
      msg,
    };
    socket.emit("message", msgObj);
    setChat((current) => [...current, msgObj]);
  };

  return (
    <SocketIOContext.Provider
      value={{
        socket,
        chat,
        sendMsg,
      }}
    >
      {children}
    </SocketIOContext.Provider>
  );
}
