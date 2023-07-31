import { createSelector } from "@reduxjs/toolkit";
import { selectGameState } from "../utils";

import emptyGame, { id as emptyId } from "./empty";
import testGame, { id as testId } from "./test";

import { ObjectKeys, UUID } from "../../utils";

const allGameStates = {
  [emptyId]: emptyGame,
  [testId]: testGame,
} as const;

export type gameObjIds = ObjectKeys<typeof allGameStates>;

export const allGameIds: gameObjIds[] = Object.keys(
  allGameStates,
) as gameObjIds[];

function idIsGameID(id: UUID): id is gameObjIds {
  return (
    !!id &&
    allGameIds.includes(id as gameObjIds) &&
    typeof allGameStates[id as gameObjIds] !== "undefined"
  );
}

export const selectGameStateObj = createSelector(selectGameState, (state) => {
  const { id } = state;
  if (idIsGameID(id)) {
    return allGameStates[id];
  }
  return null;
});

export default allGameStates;
