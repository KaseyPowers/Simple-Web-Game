import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { GameStatuses, BaseGameState, gameStateName } from "../type";

const emptyInitialState: BaseGameState = {
    id: "null",
    name: "~empty~",
    status: GameStatuses.waiting,
    players: [],
    state: {}
}

const emptyStateSlice = createSlice({
    name: gameStateName,
    initialState: emptyInitialState,
    reducers: {
        reset: (state, action: PayloadAction<BaseGameState | undefined>) => {
            console.log("Reset state for empty");
            return action.payload || emptyInitialState;
        }
    },
});

const gameStateObj = {
    id: emptyInitialState.id,
    slice: emptyStateSlice
};

export default gameStateObj;