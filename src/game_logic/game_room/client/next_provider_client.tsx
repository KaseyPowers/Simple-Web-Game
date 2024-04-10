"use client";
import React from "react";

import { useSession } from "next-auth/react";

import { GameRoomProvider } from "./context";

import NextGameRoomRouterComponent from "./next_routing";

// Wrap the provider with nextJs specific implementation details
export default function NextGameRoomProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // get session data
  const session = useSession();
  const userId = session?.data?.user?.id;
  return (
    <GameRoomProvider userId={userId}>
      <NextGameRoomRouterComponent />
      {children}
    </GameRoomProvider>
  );
}
