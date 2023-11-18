import { createSlice } from '@reduxjs/toolkit';

import {gameStateName, PromptGameStateDefinition, BaseGameDefinitionInput, CardTypeKeys, GameStatuses, getEmptyPromptGameState, getInitialPromptGameState} from "../../../game_definition";


import { resetGameAction, startGameAction } from "../utils";


export const id = "test_1" as const;

export type TestGameState = PromptGameStateDefinition & {
    id: typeof id
};

const testGameInitialEmptyState: BaseGameDefinitionInput<TestGameState> = {
    id,
    name: "Test Other State",
    status: GameStatuses.waiting,
    players: [],
    meta: {
        minPlayers: 2,
        maxPlayers: 4,
        allCards: {
            [CardTypeKeys.ANSWER]: [],
            [CardTypeKeys.PROMPT]: []
        },
        minHandSize: 7
    }
}
/** this inital state is empty, to save some time and not shuffle a new deck */
const testInitialGameState: TestGameState = {
    ...testGameInitialEmptyState,
    state: getEmptyPromptGameState<TestGameState>(testGameInitialEmptyState)
}

export const testStateSlice = createSlice({
    name: gameStateName,
    initialState: testInitialGameState,
    reducers: {
    },
    extraReducers(builder) {
        builder.addCase(startGameAction, (state, action) => {
            state.status = GameStatuses.playing;
            state.players = action.payload;     
            state.state = getInitialPromptGameState(state);
        })
        builder.addCase(resetGameAction, (state, action) => {
            if (action.payload.keepPlaying && state.status !== GameStatuses.waiting) {
                return {
                    ...state,
                    state: getInitialPromptGameState(state)
                };
            }
            return {
                ...testInitialGameState
            };
        });
    },
});


export default testStateSlice;