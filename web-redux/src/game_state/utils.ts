import { createSelector } from '@reduxjs/toolkit';

import { RootState } from "../app/store";

import { gameStateName } from "./type";

/** Common selectors */
export const selectGameState = (state: RootState) => state[gameStateName];

export const selectGameID = createSelector(selectGameState, (state) => state.id);
export const selectGameName = createSelector(selectGameState, (state) => state.name);
export const selectGameStatus = createSelector(selectGameState, (state) => state.status);
export const selectGameMeta = createSelector(selectGameState, (state) => state.meta);
