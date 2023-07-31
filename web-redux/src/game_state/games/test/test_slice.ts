import { createSlice } from '@reduxjs/toolkit';

import { resetGameAction, startGameAction } from "../utils";
import { GameStatuses, BaseGameState, gameStateName } from "../../type";

export const id = "test_1" as const;

const testInitialState: BaseGameState = {
    id,
    name: "Test Other State",
    status: GameStatuses.waiting,
    players: [],
    state: {},
    meta: {
        minPlayers: 2,
        /** Unreasonable max */
        maxPlayers: 4
    }
};

export const testStateSlice = createSlice({
    name: gameStateName,
    initialState: testInitialState,
    reducers: {
    },
    extraReducers(builder) {
        builder.addCase(startGameAction, (state, action) => {
            state.status = GameStatuses.playing;
            state.players = action.payload;
        })
        builder.addCase(resetGameAction, (state, action) => {
            if (action.payload.keepPlaying && state.status !== GameStatuses.waiting) {
                const { status, players } = state;
                return {
                    ...testInitialState,
                    status,
                    players
                }
            }

            return {
                ...testInitialState
            };
        });
    },
});

export default testStateSlice;