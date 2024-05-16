/**
 * Store behavior:
 *
 * - keep current state store
 * - function to call with incoming action
 * - store incoming actions (in case we get a new one while processing previous action)
 * - when actions are finished (or some other threshold to send periodic updates if the queue is building up too quickly)
 * - get "emit" structure(s) from the updated store (could default to just using the state unchanged, but allow for "internal" and "exposed" state for game logic);
 * - get changes of the emitting structure, and when they aren't empty, inform listener(s) of the change
 *
 *
 * Information needed to create:
 * - Initial State
 * - process for handling actions (reducer)
 * - (predicted/potential) options around handling "invalid" actions. Ex. a game with 2 players doing an action in a specific order but could be submitted around the same time, so could allow delaying the second players action if it comes in first
 * - listener/callback for changes (OR allow it to be registered after the fact)
 * - emit structure logic,
 */

/**
 * basic diffing logic:
 * - server: (previous, next) => diff
 * - client: (previous, diff) => next
 *
 * iterations could allow extensions to track the changes as we go instead of calcualting afterwards.
 * (ex. immer's patches during the reducer logic, but would need a way to convert state-patches to emittingStore-patches)
 */

/**
 * emit structure assumptions:
 * - emitting a single public structure is easy/simple, one listener to call for a change, and done
 * - if more granular approach:
 *  - create an object like Record<EmitGroupKey, EmitGroup'sChanges> that the listener will receive. Let the listener handle how it distributes that information.
 */

/**
 * will start with a root state, but some of this will get split into a more generic version that runs in "slices"
 * Also how this works will depend on if I have a single store for each game and/or gameRoom, or a single store for global state, if the latter, will need to figure out how best to split logic so that rooms and different games can be handled on their own
 */

import type { Immutable, Draft } from "immer";
import { freeze, produce, castImmutable, castDraft, nothing } from "immer";

type ReducerFn<State, Actions> = (
  state: Draft<State>,
  action: Actions,
) =>
  | State
  | void
  | undefined
  | (State extends undefined ? typeof nothing : never);
type Dispatch<Actions> = <A extends Actions>(action: A) => void;

type DataStoreOptions<State, Actions, EmitState = State> = {
  initialState: State;
  reducer: ReducerFn<State, Actions>;
  toEmitState(input: State): EmitState;
};

interface DataStore<State, Actions, EmitState> {
  getState(): State;
  getEmitState(): EmitState;
  dispatch: Dispatch<Actions>;
}

export default function createStore<State, Actions, EmitState = State>({
  initialState,
  reducer,
  toEmitState,
}: DataStoreOptions<State, Actions, EmitState>): DataStore<
  State,
  Actions,
  EmitState
> {
  let currentState = freeze(initialState, true);
  let currentEmitState = toEmitState(currentState);

  function getState() {
    return currentState;
  }
  function getEmitState() {
    return currentEmitState;
  }

  const currentReducer = produce<State, [action: Actions]>(reducer);

  // process a single event, useful for eventually using a queue of events
  function processEvent(state: State, event: Actions): State {
    // TODO: Validate event
    return currentReducer(state, event);
  }

  function dispatch<A extends Actions>(event: A) {
    const nextState = processEvent(currentState, event);
    const nextEmitState = toEmitState(nextState);
    // TODO: Check changes;
    // update state
    currentState = nextState;
    currentEmitState = nextEmitState;
  }

  return {
    getState,
    getEmitState,
    dispatch,
  };
}
