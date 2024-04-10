"use client";

import React from "react";

import { useGameRoomCtx } from "~/game_logic/game_room/client/context";

import Button from "~/components/button";
import LoadingIndicator from "~/components/loading_indicator";
import { DisplayUserById } from "~/components/user.client";

import Chat from "./chat";

export default function Page({ params }: { params: { roomId: string } }) {
  const { room, roomErr, loading } = useGameRoomCtx();

  if (roomErr) {
    return (
      <div className="flex flex-col items-center justify-center">
        {roomErr}
        <Button.Link href="/">Go back to landing</Button.Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  // check if data and params match
  if (room?.roomId !== params.roomId) {
    console.log(
      `Not sure when this can happen. room and params not matching but no error/loading state. params: ${params.roomId} - roomId: ${room?.roomId}`,
    );
  }

  return (
    <div className="flex h-full w-full flex-row items-stretch gap-4">
      <div className="flex flex-initial flex-col items-stretch divide-y-2 border-r bg-white p-4 text-black">
        <div>
          <div className="text-center">Players:</div>
          <ul className="my-2 space-y-2">
            {(room?.players ?? []).map((playerId) => (
              <li key={playerId}>
                <DisplayUserById
                  userId={playerId}
                  avatarProps={{ alt: `${playerId} - Player Avatar` }}
                  showMe="append"
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-auto">
          <Chat />
        </div>
      </div>
      <div className="flex-auto">Content</div>
    </div>
  );
}

/* <>
  <h1>
    Game Room: params-{params.roomId} socket-{room?.roomId}
    <Chat />
  </h1>
</>; */
