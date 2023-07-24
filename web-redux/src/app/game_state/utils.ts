import { createSelector } from '@reduxjs/toolkit';

import { RootState } from "../store";

import { gameStateName } from "./type";

/** Common selectors */
export const selectGameState = (state: RootState) => state[gameStateName];

export const selectGameStatus = createSelector(selectGameState, (state) => state.status);


export const selectGameName = createSelector(selectGameState, (state) => state.name);