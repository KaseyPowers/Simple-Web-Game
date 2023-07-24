import type { Reducer } from "redux";
import { configureStore, ThunkAction, Action, combineReducers } from '@reduxjs/toolkit';

import { gameStateName, BaseGameState } from "./game_state/type";

import { getGameStateSlice, starterGameState, sliceIds } from "./game_state/slices";

import counterReducer from '../features/counter/counterSlice';

import playerProfilesReducer from '../features/players/player_profiles_slice';

const staticReducers = {
  counter: counterReducer,
  players: playerProfilesReducer
};

type GameStateReducer = Reducer<BaseGameState>

/** TODO: gameState reducer stuff */
type ReducerMap = typeof staticReducers & {
  [gameStateName]: GameStateReducer
}

let reducerMap: ReducerMap = {
  ...staticReducers,
  [gameStateName]: getGameStateSlice(starterGameState).reducer
};

/** 
 * Store for the base store of logic, working with the true state of the game.
 * NOTE: Should move to BE logic later, but learning here for now
 */
export const store = configureStore({
  reducer: reducerMap,
});

export function setGameStateReducer(gameStateId: sliceIds) {
  /** Make sure this isn't the currently used state to avoid resetting */
  if (store.getState()[gameStateName].id === gameStateId) {
    console.warn("Game state already using this id");
    return;
  }
  const slice = getGameStateSlice(gameStateId);

  reducerMap = { ...reducerMap, [gameStateName]: slice.reducer };
  /** TODO: figure out what happens with state while swapping between reducers of the game key */
  store.replaceReducer(combineReducers(reducerMap));
  if (slice.actions.reset) {
    store.dispatch(slice.actions.reset());
    // store.dispatch(slice.actions.reset(slice.getInitialState()));
  }
  return store;
}


export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
