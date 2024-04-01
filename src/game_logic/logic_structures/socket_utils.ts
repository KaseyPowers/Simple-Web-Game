import {} from "socket.io";
import type {
  ServerSocketType,
  ServerType,
  RemoteSocketType,
} from "./socket_types";
import type { AcknowledgementCallback } from "../util_types";

// will wrap the ids with a template to make sure there aren't somehow overlaps
export const socketRooms = {
  userId: (userId: string) => `user_${userId}`,
  roomId: (roomId: string) => `room_${roomId}`,
};

/**
 * Server+Socket Utils
 * NOTE: These don't deal with validating the user/roomId just what socket-rooms and socket-data is set up
 */

// util for grabbing the `.in(room)` with the util string template applied
export function inGameRoom(io: ServerType | ServerSocketType, roomId: string) {
  return io.in(socketRooms.roomId(roomId));
}
export function inUserIdRoom(
  io: ServerType | ServerSocketType,
  userId: string,
) {
  return io.in(socketRooms.userId(userId));
}

// function to have a single socket leave a gameRoom and emit the leave event
export function socketLeaveRoom(
  socket: ServerSocketType | RemoteSocketType,
  roomId: string,
) {
  // assume that socket.leave will ignore the call if socket isn't in the room
  void socket.leave(socketRooms.roomId(roomId));

  if (socket.data.roomId === roomId) {
    delete socket.data.roomId;
  }
  // emit the leave event to this socket's client
  socket.emit("leave_room", roomId);
}
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
  const socketRoomId = socketRooms.roomId(roomId);
  return userSockets.some((socket) => socket.rooms.has(socketRoomId));
}
// will have all sockets associated with this user leave the room
export async function userIdLeaveRoom(
  io: ServerType,
  userId: string,
  roomId: string,
) {
  // this depends on new sockets joining a room for their userId
  const userSockets = await getUserSockets(io, userId);
  for (const socket of userSockets) {
    socketLeaveRoom(socket, roomId);
  }
}
// while userId will make sure all sockets for userId leave the room, this makes sure that all sockets for a roomId leave
export async function allSocketsLeaveRoom(io: ServerType, roomId: string) {
  const roomSockets = await inGameRoom(io, roomId).fetchSockets();
  for (const socket of roomSockets) {
    socketLeaveRoom(socket, roomId);
  }
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
