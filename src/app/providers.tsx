"use client";
import React from "react";

import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "~/trpc/react";
import { GameRoomProvider } from "~/game_logic/game_room/context";

import type { Session } from "next-auth";

export default function ContextProviders({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <TRPCReactProvider>
      <SessionProvider basePath="/api/auth" session={session}>
        <GameRoomProvider>{children}</GameRoomProvider>
      </SessionProvider>
    </TRPCReactProvider>
  );
}
