import React from "react";

import type { Session } from "next-auth";
import { getServerAuthSession } from "~/server/auth";

import { GameRoomProvider } from "./context";

import NextGameRoomRouterComponent from "./next_routing";

// base provider that just adds the router component next to the children
export const NextGameRoomProvider = ({
  children,
  userId,
  session,
}: {
  children: React.ReactNode;
  userId?: string;
  session?: Session | null;
}) => {
  const useUserId: string | undefined =
    userId ?? session?.user?.id ?? undefined;
  return (
    <GameRoomProvider userId={useUserId}>
      <NextGameRoomRouterComponent />
      {children}
    </GameRoomProvider>
  );
};

export async function NextGameRoomProviderGetSession({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  return (
    <NextGameRoomProvider session={session}>{children}</NextGameRoomProvider>
  );
}
