import { produce } from "immer";
import type { Reducer, InputReducer, ActionType } from "./types";

// check if already been wrapped
function isImmerWrapped<S, A extends ActionType>(
  val: InputReducer<S, A>,
): val is Reducer<S, A> {
  return !!("immerWrapped" in val && val.immerWrapped);
}

// simple wrap a reducer function with immer, will make sure we don't accidentally convert it multiple times, could still be wrapped in produce when written but will figure that out later (if this part ends up being shared)
export function wrapReducer<State, Action extends ActionType>(
  fn: InputReducer<State, Action>,
): Reducer<State, Action> {
  if (isImmerWrapped(fn)) {
    return fn;
  }
  // wrapped function is essentially just a curried fn
  const outputFn = (state: State, action: Action) => {
    return produce(state, (draft) => fn(draft, action));
  };
  outputFn.immerWrapped = true as const;
  return outputFn;
}
