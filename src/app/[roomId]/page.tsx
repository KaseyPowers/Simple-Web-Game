"use client";

import React, { useEffect } from "react";
import { useSocketContext } from "~/context/socket";

import Chat from "~/app/components/chat";

export default function Page({ params }: { params: { roomId: string } }) {
  const { socket, room } = useSocketContext();

  const inRoom = room?.roomId === params.roomId;

  // on load, try joining room if not in it yet
  // TODO: Later we will add a "join" type option from landing page
  useEffect(() => {
    if (!inRoom) {
      socket.emit("join_room", params.roomId);
    }
  }, []);

  return inRoom ? (
    <>
      <h1>
        Game Room: params-{params.roomId} socket-{room?.roomId}
        <Chat />
      </h1>
    </>
  ) : (
    <h1>Joining Room: {params.roomId}...</h1>
  );
}
