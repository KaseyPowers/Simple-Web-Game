import type { Reducer } from "redux";
import { configureStore, ThunkAction, Action, combineReducers } from '@reduxjs/toolkit';

import playerProfilesReducer from '../features/players/player_profiles_slice';

import { gameStateName, BaseGameState } from "../game_state/type";

import emptyGameObj from "../game_state/games/empty";

import type { sliceIds } from "../game_state/games/all_states";
import allGameStates from "../game_state/games/all_states";


const emptyGameId = emptyGameObj.id;

const staticReducers = {
  players: playerProfilesReducer
};

type GameStateReducer = Reducer<BaseGameState>

/** TODO: gameState reducer stuff */
type ReducerMap = typeof staticReducers & {
  [gameStateName]: GameStateReducer
}

let reducerMap: ReducerMap = {
  ...staticReducers,
  [gameStateName]: allGameStates[emptyGameId].slice.reducer
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
  const slice = allGameStates[gameStateId].slice;

  reducerMap = { ...reducerMap, [gameStateName]: slice.reducer };
  /** TODO: figure out what happens with state while swapping between reducers of the game key */
  store.replaceReducer(combineReducers(reducerMap));
  if (slice.actions.reset) {
    store.dispatch(slice.actions.reset({}));
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
