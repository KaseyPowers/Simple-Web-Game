import { createSlice } from '@reduxjs/toolkit';

import { createResetReducer } from "../utils";
import { GameStatuses, BaseGameState, gameStateName } from "../../type";

const testInitialState: BaseGameState = {
    id: "test_1",
    name: "Test Other State",
    status: GameStatuses.waiting,
    players: [],
    state: {},
    meta: {
        minPlayers: 2,
        /** Unreasonable max */
        maxPlayers: 4
    }
}

export const testStateSlice = createSlice({
    name: gameStateName,
    initialState: testInitialState,
    reducers: {
        reset: createResetReducer(testInitialState),
    },
});

export default testStateSlice;