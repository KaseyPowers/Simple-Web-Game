"use client";

import React from "react";
import { useSocketContext } from "~/app/context/room_context";

import Chat from "~/app/components/chat";

export default function Page({ params }: { params: { roomId: string } }) {
  const { room } = useSocketContext();

  const inRoom = room?.roomId === params.roomId;

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
