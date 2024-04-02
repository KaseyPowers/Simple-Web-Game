"use client";
import { useEffect } from "react";

import socket from "./client";

export default function useSocket(userId?: string) {
  useEffect(() => {
    void fetch("/api/socket");
  }, []);

  useEffect(() => {
    if (!userId) {
      // waiting for a userID
      return;
    }
    socket.auth = { userId };
    socket.connect();

    // add any entry/basic events:
    socket.on("connect", () => {
      console.log("Socket Connected: ", socket.id);
    });

    // on unmount, disconnect and turn off any relevant listeners
    return () => {
      socket.disconnect();
      socket.off("connect");
    };
  }, [userId]);

  return socket;
}
