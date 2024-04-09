import { useEffect } from "react";

import socket from "./client";

export const useSocketListener: (
  ...args: Parameters<typeof socket.on>
) => void = (event, eventFn) => {
  useEffect(() => {
    socket.on(event, eventFn);
    return () => {
      socket.off(event);
    };
  }, [event, eventFn]);
};
// simple fn that wraps the socket call
// TODO: See if needed or keep the error wrapping logic always
export const socketEmitBase: typeof socket.emitWithAck = async (...args) =>
  socket.emitWithAck(...args);

// expected fn to use, will check for error callback and throw an error
export const socketEmit: typeof socket.emitWithAck = async (...args) => {
  const response = await socketEmitBase(...args);
  // just throw an error if the callback indicates one
  if (response?.error) {
    // current error type definition only has error.message defined
    throw new Error(response.error.message);
  }
  return response;
};

export function useSocket(userId: undefined | string) {
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
}
