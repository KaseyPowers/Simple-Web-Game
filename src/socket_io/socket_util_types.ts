/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ServerType, ServerSocketType } from "./socket_types";
// basic acknowledgement fn type, just defining what's needed for common error logic
export interface AckErrResponse {
  error: {
    message: string;
  };
}
export type AcknowledgementCallback<
  ResponseType extends AckErrResponse = AckErrResponse,
> = (response?: ResponseType) => void;

// basic event type :shrug:
type eventFnType = (...args: any) => void;

export type WithAck<T extends eventFnType> = (
  ...args: [...Parameters<T>, AcknowledgementCallback]
) => void;

export type WithOptionalAck<T extends eventFnType> = (
  ...args: Parameters<T> | [...Parameters<T>, AcknowledgementCallback]
) => void;

export type EventsWithAck<T> = {
  [Property in keyof T]: T[Property] extends eventFnType
    ? WithAck<T[Property]>
    : never;
};

export interface ServerHandlerObj {
  io: ServerType;
  socket: ServerSocketType;
}

// common function type for handlers
export type handlersFunction = (
  serverObj: ServerHandlerObj,
  ...args: any[]
) => void;
