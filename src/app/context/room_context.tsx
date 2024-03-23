"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import { skipToken } from "@tanstack/react-query";

import { api, type RouterOutputs } from "~/trpc/react";

import type { Session } from "next-auth";

import type { ClientSocketType } from "~/types/socket";
import type { GameRoomDataI } from "~/game_logic/room_types";

const socket: ClientSocketType = io({
  path: "/api/socket",
  // autoconnect false to connect in provider logic
  autoConnect: false,
});

interface PlayerDisplayData {
  loading: boolean;
  error?: string;
  playersById: Record<
    string,
    RouterOutputs["users"]["playersByIds"][number] & {
      me: boolean;
    }
  >;
}

function usePlayerDisplayData(
  userId?: string,
  players?: string[],
): PlayerDisplayData {
  const displayPlayerResults = api.users.playersByIds.useQuery(
    userId && players ? { players } : skipToken,
  );

  return useMemo(() => {
    const { isLoading, isError, data, error } = displayPlayerResults;

    const output: PlayerDisplayData = {
      loading: isLoading,
      playersById: {},
    };

    if (isError) {
      output.error = error.message;
    }

    if (data) {
      output.playersById = data.reduce(
        (byId, player) => {
          byId[player.id] = { ...player, me: player.id === userId };
          return byId;
        },
        {} as PlayerDisplayData["playersById"],
      );
    }

    return output;
  }, [displayPlayerResults]);
}

type RoomStateType = GameRoomDataI | null;

interface ISocketContext {
  socket: ClientSocketType;
  userId: string;
  room: RoomStateType;
  playerData: PlayerDisplayData;
  setRoom: React.Dispatch<React.SetStateAction<RoomStateType>>;
}

const SocketIOContext = createContext<ISocketContext | null>(null);

export function useSocketContext(): ISocketContext {
  const socketContext = useContext(SocketIOContext);

  if (!socketContext) {
    throw new Error("useSocketContext must be used within <SocketIOProvider>");
  }

  return socketContext;
}

export function SocketIOProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const userId = session?.user?.id;

  const router = useRouter();
  const params: { roomId?: string } | null = useParams();
  const [room, setRoom] = useState<RoomStateType>(null);
  const [errMsg, setErrMsg] = useState<string | undefined>();

  const playerData = usePlayerDisplayData(userId, room?.players);

  useEffect(() => {
    void fetch("/api/socket");
  }, []);

  // navigate on change to roomId
  // TODO: Verify the router doesn't change on navigation, otherwise this could be triggered a lot
  useEffect(() => {
    // NOTE: need to pick priority of info from params vs. roomId
    const paramId = params?.roomId;
    const dataId = room?.roomId;

    /**
     * if there is a param and it doesn't match the room data. assume we need to try joining the room.
     * if creating a room and so going from expected null room, that will only happen when there is no paramId
     */
    if (paramId && paramId !== dataId) {
      console.log(
        `paramID found, but doesn't match the dataId, will try joining`,
      );
      socket.emit("join_room", paramId, (response) => {
        // if the response is a string, thats an error/msg about something preventing joining. so will navigate back to landing page with an alert.
        if (typeof response === "string") {
          // don't love using this alert but good starting point.
          // need to confirm navigatin won't remove it.
          setErrMsg(response);
          setRoom(null);
        }
        // otherwise expect join to have worked out and will get the dataId to match soon
      });
    }
    // if no param found, and a roomId is, assume we should navigate to it
    if (!paramId && dataId) {
      console.log(
        `dataId added, and no paramId, will navigate to page: ${dataId}`,
      );
      router.push(`/${dataId}`);
    }
  }, [router, params?.roomId, room?.roomId]);

  useEffect(() => {
    if (!userId) {
      // waiting for a userID
      return;
    }
    socket.auth = { userId };
    socket.connect();

    // add socket listeners potentially

    socket.on("connect", () => {
      console.log("Socket Connected: ", socket.id);
    });

    socket.on("room_info", (data) => {
      // use room update, verify there isn't a room already stored (if user is using multiple tabs for multiple games)
      setRoom((current) => {
        // if there is a room, default to keeping it unchanged. However if it matches the new roomId, assume this data is valid and use it just in case
        // return current.roomId current?.roomId !== data.roomId ? current : data;
        return !current?.roomId || current?.roomId === data.roomId
          ? data
          : current;
      });
    });

    socket.on("leave_room", (roomId) => {
      setRoom((current) => {
        // check if closed room is one we are in, leave room if so
        return current?.roomId === roomId ? null : current;
      });
    });

    socket.on("players_update", (roomId, playerData) => {
      setRoom((current) => {
        if (current?.roomId === roomId) {
          return {
            ...current,
            ...playerData,
          };
        }
        return current;
      });
    });

    socket.on("message", (msg) => {
      setRoom((current) => {
        // verify the msg is for the current room, assume player is valid
        if (current?.roomId && current?.roomId === msg.roomId) {
          return {
            ...current,
            chat: [...(current?.chat ?? []), msg],
          };
        }
        return current;
      });
    });

    // cleanup
    return () => {
      socket.disconnect();
      socket.off("connect");
      socket.off("room_info");
      socket.off("leave_room");
      socket.off("players_update");
      socket.off("message");
    };
  }, [userId]);

  // wait until userId defined before rendering more
  if (!userId) {
    return null;
  }
  // if there is an error, render here with option to navigate back to homepage
  if (errMsg) {
    return (
      <div>
        {errMsg}
        <button
          onClick={() => {
            setErrMsg(undefined);
            router.push("/");
          }}
        >
          Ok
        </button>
      </div>
    );
  }

  return (
    <SocketIOContext.Provider
      value={{ socket, room, playerData, userId, setRoom }}
    >
      {children}
    </SocketIOContext.Provider>
  );
}
