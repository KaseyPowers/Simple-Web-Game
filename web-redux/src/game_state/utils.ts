import { createSelector } from '@reduxjs/toolkit';

import { RootState } from "../app/store";

import { selectPlayerProfilesById } from "../features/players/player_profiles_selectors";

import { gameStateName, PlayerGameStateProfile } from "./type";

/** Common selectors */
export const selectGameState = (state: RootState) => state[gameStateName];

export const selectGameID = createSelector(selectGameState, (state) => state.id);
export const selectGameName = createSelector(selectGameState, (state) => state.name);
export const selectGameStatus = createSelector(selectGameState, (state) => state.status);
export const selectGamePlayerIds = createSelector(selectGameState, (state) => state.players);
export const selectGameMeta = createSelector(selectGameState, (state) => state.meta);

export const selectGameStateState = createSelector(selectGameState, (state) => state.state);
export const selectGamePlayerState = createSelector(selectGameStateState, state => state.playerStates);

export const selectGamePlayers = createSelector(selectGamePlayerIds, selectPlayerProfilesById, selectGamePlayerState,  (ids, profilesById, playerStates) => ids.map(id => ({...profilesById[id], state: playerStates[id]})));