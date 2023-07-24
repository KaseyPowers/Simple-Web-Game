import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { GameStatuses, BaseGameState, gameStateName } from "../type";

const testInitialState: BaseGameState = {
    id: "test_1",
    name: "Test Other State",
    status: GameStatuses.waiting,
    players: [],
    state: {}
}

export const testStateSlice = createSlice({
    name: gameStateName,
    initialState: testInitialState,
    reducers: {
        reset: (state, action: PayloadAction<BaseGameState | undefined>) => {
            console.log("Reset state for test");
            return action.payload || testInitialState;
        }
    },
});

const gameStateObj = {
    id: testInitialState.id,
    slice: testStateSlice
};

export default gameStateObj;