"use client";
import { useSocketContext } from "../context/socket_context";
import React from "react";

import type { Session } from "next-auth";

export default function Chat({ session }: { session: Session }) {
  const { chat, socket } = useSocketContext();

  const sendChat = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      msg: { value: string };
    };
    const msg = target.msg.value;

    socket.emit("message", {
      user: session.user?.name ?? "Missing User?",
      msg,
    });
  };

  return (
    <div>
      <div>Chat Page</div>
      <div className="flex flex-col space-x-1 font-mono">
        {chat.length ? (
          chat.map((msg, index) => (
            <div key={`chat_${index}`}>
              <span>{session.user?.name === msg.user ? "Me" : msg.user}</span>
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
