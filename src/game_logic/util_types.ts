/* eslint-disable @typescript-eslint/no-explicit-any */

// basic acknowledgement fn type, just defining what's needed for common error logic
export interface AckErrResponse {
  error: {
    message: string;
  };
}
export type AcknowledgementCallback<
  ResponseType extends AckErrResponse = AckErrResponse,
> = (response?: ResponseType) => void;

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
