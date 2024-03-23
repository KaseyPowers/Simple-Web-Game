"use client";
import React from "react";

import { useSocketContext } from "~/app/context/room_context";

export default function CreateRoomPage() {
  const { socket } = useSocketContext();

  const onClick = () => {
    socket.emit("create_room");
  };

  return (
    <>
      <h1>Create a Room Page:</h1>
      <div>
        TODO: any settings needed before a room can be created. (most
        configurations will probably be done by the host once the room is
        started?)
      </div>
      <button onClick={onClick}>Create Room</button>
    </>
  );
}
