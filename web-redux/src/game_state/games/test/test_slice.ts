import { createSlice } from '@reduxjs/toolkit';

import { resetGameAction, startGameAction } from "../utils";
import { GameStatuses, BaseGameState, gameStateName } from "../../type";

export const id = "test_1" as const;

interface TestGamePlayerState {
    score: number,
}

export type TestGameState = BaseGameState<TestGamePlayerState>;

const testInitialState: TestGameState = {
    id,
    name: "Test Other State",
    status: GameStatuses.waiting,
    players: [],
    state: {
        playerStates: {}
    },
    meta: {
        minPlayers: 2,
        /** Unreasonable max */
        maxPlayers: 4
    }
};

const initialPlayerState: TestGamePlayerState = {
    score: 0,
}

function getInitialPlayerStates(players: TestGameState["players"]): TestGameState["state"]["playerStates"] {
    return players.reduce((output, id, index) => {
        output[id] = initialPlayerState;
        return output;
    }, {} as TestGameState["state"]["playerStates"]);
}

export const testStateSlice = createSlice({
    name: gameStateName,
    initialState: testInitialState,
    reducers: {
    },
    extraReducers(builder) {
        builder.addCase(startGameAction, (state, action) => {
            state.status = GameStatuses.playing;
            state.players = action.payload;        
            state.state.playerStates = getInitialPlayerStates(action.payload); 
        })
        builder.addCase(resetGameAction, (state, action) => {
            if (action.payload.keepPlaying && state.status !== GameStatuses.waiting) {
                const { status, players } = state;
                return {
                    ...testInitialState,
                    status,
                    players,
                    state: {
                        ...testInitialState.state,
                        playerStates: getInitialPlayerStates(players)
                    }
                }
            }

            return {
                ...testInitialState
            };
        });
    },
});

export default testStateSlice;