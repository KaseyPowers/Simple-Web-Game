import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

import playerProfilesReducer from '../features/players/player_profiles_slice';

import gamesReducer from "../game_state/games_slice"


/** 
 * Store for the base store of logic, working with the true state of the game.
 * NOTE: Should move to BE logic later, but learning here for now
 */
export const store = configureStore({
  reducer: {    
  players: playerProfilesReducer,
    games: gamesReducer
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
