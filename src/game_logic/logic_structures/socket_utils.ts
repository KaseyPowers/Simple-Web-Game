import {} from "socket.io";
import type {
  ServerSocketType,
  ServerType,
  RemoteSocketType,
} from "./socket_types";
import type { AcknowledgementCallback } from "../util_types";

// userId based rooms
const getUserIdRoom = (userId: string) => `user_${userId}`;
function inUserIdRoom(io: ServerType | ServerSocketType, userId: string) {
  return io.in(getUserIdRoom(userId));
}
function joinUserIdRoom(io: ServerSocketType, userId: string) {
  return io.join(getUserIdRoom(userId));
}
// gameRoom based Rooms
const getGameRoom = (roomId: string) => `room_${roomId}`;
function inGameRoom(io: ServerType | ServerSocketType, roomId: string) {
  return io.in(getGameRoom(roomId));
}
function joinGameRoom(io: ServerSocketType, userId: string) {
  return io.join(getGameRoom(userId));
}

// will wrap the ids with a template to make sure there aren't somehow overlaps
export const socketRoomUtils = {
  getUserIdRoom,
  userId: getUserIdRoom,
  inUserIdRoom,
  joinUserIdRoom,
  getGameRoom,
  roomId: getGameRoom,
  inGameRoom,
  joinGameRoom,
};

/**
 * Server+Socket Utils
 * NOTE: These don't deal with validating the user/roomId just what socket-rooms and socket-data is set up
 */

// grab all sockets for this user
export function getUserSockets(io: ServerType, userId: string) {
  return inUserIdRoom(io, userId).fetchSockets();
}

export async function hasSocketsInRoom(
  io: ServerType,
  roomId: string,
  userId: string,
) {
  const userSockets = await getUserSockets(io, userId);
  const socketRoomId = socketRoomUtils.getGameRoom(roomId);
  return userSockets.some((socket) => socket.rooms.has(socketRoomId));
}

/**
 *
 * @param eventHandler: The main logic for the event, will catch thrown errors
 * @param alwaysCallCallback: Indicates if the handler should call callback with no arguments when no errors happen
 * @param defaultErrorMsg: The default error message to use if the caught error doesn't provide a usable one
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function eventErrorHandler<T extends any[]>(
  eventHandler: (...args: T) => void | Promise<void>,
  alwaysCallCallback?: true,
  defaultErrorMsg?: string,
) {
  // actual handler takes in the initial args, or will add an optional callbackFn to the end
  return (...args: T | [...T, AcknowledgementCallback]) => {
    // first check if a callback is provided
    let callback: undefined | AcknowledgementCallback = undefined;
    if (typeof args[args.length - 1] === "function") {
      callback = args[args.length - 1] as AcknowledgementCallback;
    }

    const handleError = (err) => {
      console.log("handling error!", err);
      let message = defaultErrorMsg ?? "Something went wrong!";
      if (typeof err === "string") {
        message = err;
      } else if (err instanceof Error) {
        // NOTE: We can update this logic if we want to get more fancy
        message = err.message;
      }

      if (callback) {
        callback({
          error: {
            message,
          },
        });
      }
    };

    const onSuccess = () => {
      if (callback && alwaysCallCallback) {
        callback();
      }
    };

    let isPromise = false;
    try {
      // cast the args to the expected type, if the fn is added it should be ignored, but will still work if the handler fn has logic for the callback too
      const returned = eventHandler(...(args as T));
      if (returned && typeof returned.then === "function") {
        isPromise = true;
        returned.then(onSuccess, handleError);
      }
    } catch (err) {
      handleError(err);
    }
    // only verify calling onSuccess if the handler isn't a promise
    if (!isPromise) {
      onSuccess();
    }
  };
}
