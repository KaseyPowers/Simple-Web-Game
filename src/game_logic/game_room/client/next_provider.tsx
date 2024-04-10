"use client";
import React, { useEffect } from "react";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

import { GameRoomProvider, useGameRoomCtx } from "./context";

// hook for routing stuff
function useRoomRouting() {
  const router = useRouter();
  const params: { roomId?: string } | null = useParams();
  const paramId = params?.roomId;

  const { roomId, joinRoom } = useGameRoomCtx();

  /**
   * Notes for this logic:
   * - Assume any changes to room come by navigating to that room
   * - will navigate to no-room page to clear errors
   *
   * So try joining the room:
   * - whenever paramId changes
   * - whenever roomId changes
   *
   * roomId should be only thing that triggers a new joinrRoom fn definition
   *
   * if roomId === paramId will clear any errors and won't emit the join_room event. So this will cover any unexpected paramId change triggers, or when roomId becomes defined to match paramId
   *
   * when navigating to a no-room state, still want to call with undefined to clear error and room data
   *
   */
  useEffect(() => {
    void joinRoom(paramId);
  }, [paramId, joinRoom]);

  // navigator to trigger when a room is assigned while in a no-room page. This should only happen from a create-room event. Will log when it happens to confirm
  useEffect(() => {
    if (!paramId && roomId) {
      console.log(
        "A roomId was defined but no paramId, should only see this during create_room events",
      );
      router.push(`/${roomId}`);
    }
  }, [paramId, roomId, router]);
}

// TBD if this is a useful pattern to make sure that router is called inside the Provider since it doesn't need to do anything else
function NextGameRoomRouterComponent() {
  useRoomRouting();
  return null;
}

// Wrap the provider with nextJs specific implementation details
export function NextGameRoomProvider({
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
