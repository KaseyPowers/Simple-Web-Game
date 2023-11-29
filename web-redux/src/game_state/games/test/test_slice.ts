import { createSlice } from '@reduxjs/toolkit';

import {gameStateName, PromptGameStateDefinition, BaseGameDefinitionInput, CardTypeKeys, GameStatuses, getEmptyPromptGameState, getInitialPromptGameState, fillPromptHands, createNextPromptRound, AnswerCard, PromptCard} from "../../../game_definition";


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
            [CardTypeKeys.ANSWER]: [
                {
                    id: "answer_1",
                    value: "answer",
                },
                {
                    value: "answer 2"
                },
                {
                    value: "a bigger blacker answer"
                },
                {
                    value: "harry potter"
                },
                {
                    value: "puff the magic dragon"
                },
                {
                    value: "Youths!"
                },
                {
                    value: "Scmidt!"
                },
                {
                    value: "I can do this all day Winston"
                },
                {
                    value: "non-vegetarian cereal"
                },
                {
                    value: "depends who's asking"
                },
                {
                    value: "time traveling to the past expecting to use future knowledge to succeed but realizing you can't remember any useful details"
                }
            ].map(card => {
                const fullCard: AnswerCard = {
                    id: card.value,
                    ...card,
                    type: CardTypeKeys.ANSWER
                }
                return fullCard
            }),
            [CardTypeKeys.PROMPT]: [
                {
                    id: "prompt",
                    value: ["question", false],
                },
                {
                    value: ["fill in the", false, "middle"]
                },
                {
                    value: ["whoops! all", false]
                }
            ].map(card => {
                const fullCard: PromptCard = {
                    id: card.value.filter(Boolean).join("-"),
                    ...card,
                    type: CardTypeKeys.PROMPT
                }
                return fullCard
            })
        },
        // minHandSize: 7,
        minHandSize: 3
    }
}
/** this inital state is empty, to save some time and not shuffle a new deck */
const testInitialGameState: TestGameState = {
    ...testGameInitialEmptyState,
    state: getEmptyPromptGameState<TestGameState>(testGameInitialEmptyState)
}

function onStart(state: TestGameState) {
    let output = {
        ...state,
        state: getInitialPromptGameState(state)
    };
    output = fillPromptHands(output);
    output = createNextPromptRound(output);
    return output;
}

export const testStateSlice = createSlice({
    name: gameStateName,
    initialState: testInitialGameState,
    reducers: {
    },
    extraReducers(builder) {
        builder.addCase(startGameAction, (state, action) => {
            let nextState = {
                ...state,
                status: GameStatuses.playing,
                players: action.payload
            };
            return onStart(nextState);
        })
        builder.addCase(resetGameAction, (state, action) => {
            if (action.payload.keepPlaying && state.status !== GameStatuses.waiting) {
                return onStart(state);
            }
            return {
                ...testInitialGameState
            };
        });
    },
});


export default testStateSlice;