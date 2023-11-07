import { createSlice } from '@reduxjs/toolkit';

import { startGameAction, resetGameAction } from "../utils";
import { GameStatuses, BaseGameDefinition, gameStateName } from "../../type";

export const id = "null" as const;

const emptyInitialState: BaseGameDefinition = {
    id,
    name: "~empty~",
    status: GameStatuses.waiting,
    players: [],
    state: {
        playerStates: {}
    },
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
    },
    extraReducers(builder) {
        builder.addCase(startGameAction, (state, action) => {
            state.status = GameStatuses.playing;
            state.players = action.payload;
        });
        builder.addCase(resetGameAction, (state, action) => {
            if (action.payload.keepPlaying && state.status !== GameStatuses.waiting) {
                const { status, players } = state;
                return {
                    ...emptyInitialState,
                    status,
                    players
                }
            }

            return {
                ...emptyInitialState
            };
        });
    },
});

export default emptyStateSlice;