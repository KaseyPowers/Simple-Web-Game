import { createSlice } from '@reduxjs/toolkit';

import { startGameAction, resetGameAction } from "../utils";
import { GameStatuses, BaseGameStateDefinition, gameStateName } from "../../../game_definition";

export const id = "null" as const;

const emptyInitialState: BaseGameStateDefinition = {
    id,
    name: "~empty~",
    status: GameStatuses.waiting,
    players: [],
    state: {
        playerStates: {},
        deck: [],
        discardPile: []
    },
    meta: {
        minPlayers: 0,
        /** Try to use -1 to make it always above max */
        maxPlayers: -1,
        allCards: [],
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