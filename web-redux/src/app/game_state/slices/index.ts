
import emptyState from "./empty_slice";
import testState from "./test_slice";

import { GameStateReducer } from "../type";

import { ObjectKeys } from "../../../utils";


export const slices = {
    [emptyState.id]: emptyState.slice,
    [testState.id]: testState.slice
} as const;
export type sliceIds = ObjectKeys<typeof slices>;
export const starterGameState = emptyState.id;

export const getGameStateSlice = (id: sliceIds) => slices[id];
export const getGameStateReducer = (id: sliceIds): GameStateReducer => getGameStateSlice(id).reducer;