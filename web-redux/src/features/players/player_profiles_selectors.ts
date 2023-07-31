import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '../../app/store';
import { PlayerStatuses } from "./player_profiles_slice";

/**
 * This function is a selector used to convert the player profiles state back into an array, using the order in the allIds array.
 */
export const selectPlayerProfilesState = (state: RootState) => state.players;
export const selectPlayerProfilesById = createSelector(selectPlayerProfilesState, state => state.byId);
export const selectPlayerProfileIds = createSelector(selectPlayerProfilesState, state => state.allIds);
export const selectPlayerProfiles = createSelector([selectPlayerProfilesById, selectPlayerProfileIds], (byId, allIds) => allIds.map(id => byId[id]));
export const selectWaitingPlayers = createSelector([selectPlayerProfiles], (players) => players.filter(player => player.status === PlayerStatuses.waiting));

