"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { type Socket, io } from "socket.io-client";

export const socket = io({
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
}

const SocketIOContext = createContext<ISocketContext | null>(null);

export function useSocketContext(): ISocketContext {
  const socketContext = useContext(SocketIOContext);

  if (!socketContext) {
    throw new Error("useSocketContext must be used within <SocketIOProvider>");
  }

  return socketContext;
}

export function SocketIOProvider({ children }: { children: React.ReactNode }) {
  // Temp chat logic for learning sockets
  const [chat, setChat] = useState<IChatMsg[]>([]);

  useEffect((): void => {
    void fetch("/api/socket");
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("Socket Connected: ", socket.id);
    });

    socket.on("message", (message: IChatMsg) => {
      setChat((current) => [...current, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketIOContext.Provider
      value={{
        socket,
        chat,
      }}
    >
      {children}
    </SocketIOContext.Provider>
  );
}
