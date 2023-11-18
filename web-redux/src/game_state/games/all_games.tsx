import emptyGame, { id as emptyId } from "./empty";
import testGame, { id as testId } from "./test";

import { ObjectKeys } from "../../utils";
import { combineReducers } from "@reduxjs/toolkit";

export const allGames = {
  [emptyId]: emptyGame,
  [testId]: testGame,
} as const;

export const defaultGameId = emptyId;

export type GameObjIds = ObjectKeys<typeof allGames>;

export const allGameIds: GameObjIds[] = Object.keys(
  allGames,
) as GameObjIds[];

export const allGamesReducer = combineReducers({
  [emptyId]: emptyGame.slice.reducer,
  [testId]: testGame.slice.reducer
});
