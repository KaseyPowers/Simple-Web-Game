import { createSlice } from '@reduxjs/toolkit';

import { createResetReducer } from "../utils";
import { GameStatuses, BaseGameState, gameStateName } from "../../type";

const emptyInitialState: BaseGameState = {
    id: "null",
    name: "~empty~",
    status: GameStatuses.waiting,
    players: [],
    state: {},
    meta: {
        minPlayers: 0,
        /** Try to use -1 to make it always above max */
        maxPlayers: -1
    }
}

const emptyStateSlice = createSlice({
    name: gameStateName,
    initialState: emptyInitialState,
    reducers: {
        reset: createResetReducer(emptyInitialState),
    },
});

export default emptyStateSlice;