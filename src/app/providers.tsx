"use client";
import React from "react";

import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "~/trpc/react";
import { NextGameRoomProvider } from "~/game_logic/game_room/client/next_provider";

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
        <NextGameRoomProvider>{children}</NextGameRoomProvider>
      </SessionProvider>
    </TRPCReactProvider>
  );
}
