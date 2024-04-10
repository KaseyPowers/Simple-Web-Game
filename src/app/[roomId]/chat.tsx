"use client";

import React from "react";
import clsx from "clsx";

import { useSession } from "next-auth/react";

import { useGameRoomCtx } from "~/game_logic/game_room/client/context";
import { AvatarById } from "~/components/user.client";
import SubmitInput from "~/components/submit_input";

export default function Chat() {
  const session = useSession();
  const userId = session?.data?.user?.id;

  const { room, sendMsg } = useGameRoomCtx();

  if (!room) {
    throw new Error("Shouldn't render chat until room is available");
  }

  const { chat } = room;

  return (
    <div className="flex flex-col justify-between">
      <div className="flex flex-1 flex-col">
        {chat.length ? (
          chat.map((msg, index) => {
            const fromMe = userId === msg.userId;
            return (
              <div
                key={`chat_${index}`}
                className={clsx(
                  "flex items-center px-4 py-2",
                  fromMe ? "flex-row-reverse" : "flex-row",
                )}
              >
                <AvatarById userId={msg.userId} size="sm" />
                <div className="mx-1 rounded-lg bg-slate-200 p-2">
                  {msg.msg}
                </div>
              </div>
            );
          })
        ) : (
          <div>No Messages Yet</div>
        )}
      </div>
      <SubmitInput
        submitBtn="Send"
        label="Chat"
        disabled={!sendMsg}
        onSubmit={(val) => {
          if (sendMsg) {
            void sendMsg(val);
          }
        }}
      />
    </div>
  );
}
