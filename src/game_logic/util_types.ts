/* eslint-disable @typescript-eslint/no-explicit-any */
// basic acknowledgement fn type, returning true for valid and a string
export interface AcknowledgementErrorI {
  message: string;
}
export type ErrorAcknowledgementCallback = (
  response?: AcknowledgementErrorI,
) => void;

type eventFnType = (...args: any) => void;
export type WithErrorAck<T extends eventFnType> = (
  ...args: [...Parameters<T>, ErrorAcknowledgementCallback]
) => void;
export type WithOptionalErrorAck<T extends eventFnType> = (
  ...args: [...Parameters<T>, ErrorAcknowledgementCallback | undefined]
) => void;

export type EventsWithErrorAck<T> = {
  [Property in keyof T]: T[Property] extends eventFnType
    ? WithErrorAck<T[Property]>
    : never;
};
