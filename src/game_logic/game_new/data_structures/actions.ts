import type { Draft, Producer } from "immer";
import type {
  AnyFunction,
  BlankObject,
  FilterDefinable,
  FnReturns,
  IfNoNeverValues,
  IsNever,
  MergeObjects,
  PartialExcept,
  WithoutOverlap,
} from "~/utils/types";

type BaseActionParams<State, Payload = never, Meta = never> = [
  draft: Draft<State>,
  payload: Payload,
  meta: Meta,
];

type IfReturnsNotEmpty<T extends AnyFunction, Fallback = never> = IsNever<
  ReturnType<T>,
  Fallback,
  T
>;
// Return type for standard actions
type ActionFnReturns<State> = ReturnType<Producer<State>>;
// Util Actions return some value(s) before the response, will return never if not a valid R
type _UtilActionFnReturns<State, R extends unknown[]> = R extends []
  ? never
  : [...R, response: ActionFnReturns<State>];

type UtilActionFnReturns<State, R> = _UtilActionFnReturns<
  State,
  FilterDefinable<R>
>;
// Function definition for an action
type ActionFn<State, Payload = never, Meta = never> = (
  ...args: BaseActionParams<State, Payload, Meta>
) => ActionFnReturns<State>;
// Function definition for a util action, will return never for invalid R definition
type UtilActionFn<State, R, Payload = never, Meta = never> = IfReturnsNotEmpty<
  (
    ...args: BaseActionParams<State, Payload, Meta>
  ) => UtilActionFnReturns<State, R>
>;
/* eslint-disable @typescript-eslint/no-explicit-any */

export type AnyActionFn<State = any, Payload = never, Meta = never> = ActionFn<
  State,
  Payload,
  Meta
>;
export type AnyUtilActionFn<
  State = any,
  R = any,
  Payload = never,
  Meta = never,
> = UtilActionFn<State, R, Payload, Meta>;
// Any Function that combines both function types (use never for types that are never default, and any for others
export type EitherActionFn<
  State = any,
  Payload = never,
  Meta = never,
  R = any,
> = ActionFn<State, Payload, Meta> | UtilActionFn<State, R, Payload, Meta>;

export type ActionKey<Str extends string = string> = `on${Capitalize<Str>}`;

type ValidActionFnForKey<
  Key,
  State = any,
  Payload = never,
  Meta = never,
  R = any,
> = Key extends ActionKey
  ? AnyActionFn<State, Payload, Meta>
  : Key extends string
    ? UtilActionFn<State, R, Payload, Meta>
    : never;
type ValidActionDefForKey<
  Key,
  State = any,
  Payload = never,
  Meta = never,
  R = any,
> = Key extends string
  ? ActionDef<ValidActionFnForKey<Key, State, Payload, Meta, R>>
  : never;

// These Record objects are used for bases when extending, if creating a variable, need to use `satisfies` syntax since they will not pass validation
// a slightly more specific defined structure
export interface ActionsFnRecord<
  State = any,
  Payload = never,
  Meta = never,
  R = any,
> {
  [aKey: ActionKey]: ValidActionFnForKey<ActionKey, State, Payload, Meta>;
  [baseKey: string]: ValidActionFnForKey<any, State, Payload, Meta, R>;
}
// more specific defined structure for the record
export interface ActionsDefRecord<
  State = any,
  Payload = never,
  Meta = never,
  R = any,
> {
  [aKey: ActionKey]: ValidActionDefForKey<ActionKey, State, Payload, Meta>;
  [baseKey: string]: ValidActionDefForKey<any, State, Payload, Meta, R>;
}

export type ValidateActionsFnRecord<
  Input extends ActionsFnRecord<State, Payload, Meta, R>,
  State = any,
  Payload = never,
  Meta = never,
  R = any,
> = 0 extends {
  [Key in keyof Input]: Input[Key] extends ValidActionFnForKey<
    Key,
    State,
    Payload,
    Meta,
    R
  >
    ? 1
    : 0;
}[keyof Input]
  ? never
  : Input;

export type ValidateActionsDefRecord<
  Input extends ActionsFnRecord<State, Payload, Meta, R>,
  State = any,
  Payload = never,
  Meta = never,
  R = any,
> = 0 extends {
  [Key in keyof Input]: Input[Key] extends ValidActionFnForKey<
    Key,
    State,
    Payload,
    Meta,
    R
  >
    ? 1
    : 0;
}[keyof Input]
  ? never
  : Input;

type _GetInputRecord<T> = {
  [K in keyof T]: T[K] extends ActionDef
    ? T[K]["action"] extends EitherActionFn
      ? ActionInput<T[K]["action"]>
      : never
    : never;
};
export type ActionInputRecord<Input extends ActionsDefRecord> = _GetInputRecord<
  ValidateActionsDefRecord<Input>
>;

/* eslint-enable @typescript-eslint/no-explicit-any */

interface ActionBaseDef<Fn extends EitherActionFn> {
  standalone: boolean;
  canRun?: (...args: Parameters<Fn>) => boolean;
  prepare?: FnReturns<Parameters<Fn>>;
}

type ActionFnObj<Fn extends EitherActionFn> = {
  action: Fn;
};

// Build from the Fn, accepts Either since utils only deal with the Parameters so far
export type ActionDef<Fn extends EitherActionFn = EitherActionFn> =
  ActionBaseDef<Fn> & ActionFnObj<Fn>;
export type ActionParams<Fn extends EitherActionFn = EitherActionFn> = Partial<
  ActionBaseDef<Fn>
>;
export type ActionInput<Fn extends EitherActionFn = EitherActionFn> =
  | Fn
  | (ActionFnObj<Fn> & ActionParams<Fn>);

export function createAction<Fn extends EitherActionFn>(
  input: ActionInput<Fn>,
  params?: ActionParams<Fn>,
): ActionDef<Fn> {
  return {
    standalone: false,
    ...params,
    ...("action" in input ? input : { action: input }),
  };
}

// actual types we expect to use
export function createActionsObj<Obj extends ActionsDefRecord>(
  input: ActionInputRecord<Obj>,
): Obj;
// simplified types for the function implementation because they were annoying
export function createActionsObj(
  input: Record<string, ActionInput>,
): ActionsDefRecord {
  return Object.keys(input).reduce((output, key) => {
    const inputVal = input[key];

    if (inputVal) {
      output[key] = createAction(inputVal);
    }
    return output;
  }, {} as ActionsDefRecord);
}
