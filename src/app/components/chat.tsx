"use client";
import { useSocketContext } from "~/app/context/room_context";
import React from "react";

export default function Chat() {
  const { socket, room, userId, setRoom } = useSocketContext();

  if (!room) {
    throw new Error("Shouldn't render chat until room is available");
  }

  const { roomId, chat } = room;

  const sendChat = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      msg: { value: string };
    };
    const msg = target.msg.value;

    const msgObj = {
      roomId,
      userId,
      msg,
    };

    socket.emit("message", msgObj);
    setRoom((current) => {
      // shouldn't be possible for current to be empty here, but doing the check anyway for type safety
      if (!current) {
        return current;
      }
      return {
        ...current,
        chat: [...current.chat, msgObj],
      };
    });
  };

  return (
    <div>
      <div>Chat Page</div>
      <div className="flex flex-col space-x-1 font-mono">
        {chat.length ? (
          chat.map((msg, index) => (
            <div key={`chat_${index}`}>
              <span>{msg.userId}</span>
              <span className="mx-4">:</span>
              <span>{msg.msg}</span>
            </div>
          ))
        ) : (
          <div>No messages yet</div>
        )}
        <div>
          <form onSubmit={sendChat}>
            <input type="text" name="msg" className="text-black" />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
