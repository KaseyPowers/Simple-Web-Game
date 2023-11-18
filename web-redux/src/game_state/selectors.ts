import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../app/store";

import {allGames} from "./games/all_games";
import { allGamesStates } from "./games/selectors";

export const gameSelectionState = (state:RootState) => state.games.gameSelection;

export const selectedGameIdSelector = createSelector(gameSelectionState, state => state.selected);
export const gameIdOptionsSelector = createSelector(gameSelectionState, state => state.gameOptions);

export const selectedGameObjSelector = createSelector(selectedGameIdSelector, allGamesStates, (id, games) => games[id]);

export const selectedGameNameSelector = createSelector(selectedGameObjSelector, state => state.name);
export const selectedGameStatusSelector = createSelector(selectedGameObjSelector, state => state.status);
export const selectedGameMetaSelector = createSelector(selectedGameObjSelector, state => state.meta);

export const selectedGameComponentSelector = createSelector(selectedGameIdSelector, id => {
    const {Component, View} = allGames[id];
    return {Component, View};
});