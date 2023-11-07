import { createSlice } from '@reduxjs/toolkit';

import { resetGameAction, startGameAction } from "../utils";
import { GameStatuses, BaseGameDefinition, gameStateName } from "../../type";
import { UUID } from '../../../utils';
import { CardTypeKeys, TextGamePlayerState, TextGameState } from './types';

export const id = "test_1" as const;

export type TestGameState = BaseGameDefinition<TextGameState>;

const testInitialState: TestGameState = {
    id,
    name: "Test Other State",
    status: GameStatuses.waiting,
    players: [],
    state: {
        /** All these fields need to be properly initialized when starting the game */
        playerStates: {},
        deck: {
            [CardTypeKeys.ANSWER]: [],
            [CardTypeKeys.PROMPT]: [],
        },
        discardPile: {            
            [CardTypeKeys.ANSWER]: [],
            [CardTypeKeys.PROMPT]: [],
        },
        current_judge: undefined
    },
    meta: {
        minPlayers: 2,
        maxPlayers: 4,
        /** 
         * Standard pattern, either an array of all cards, or for this type, object split up by the different types.
         * TODO: not sure if defining the full set of cards here is best, it makes sense but if large, could cause issues during the reset steps, would need to make sure reset doesn't do unnecisary work re-creating this object
         */
        allCards: {
            [CardTypeKeys.ANSWER]: [],
            [CardTypeKeys.PROMPT]: [],
        },
        hand_size: 7
    }
};


/** Initialize the player states and the decks */
function getInitialGameState(startingState: TestGameState): TestGameState["state"] {
    const output = {...testInitialState.state};

    if (startingState.status === GameStatuses.playing) {
        /** initialize the player states */
        output.playerStates = startingState.players.reduce((playerStates, id) => {
            playerStates[id] = {
                won_hands: [],
                hand: []
            }
            return playerStates;
        }, {} as Record<UUID, TextGamePlayerState>);
        /** Initialize the deck, discard pile should be empty, but there are times it wouldn't be? :shrug: */
        [CARD_TYPES.ANSWER, CARD_TYPES.PROMPT].forEach(type => {

        });
    }

    return output;
}
/** Check each player's hand and fill with cards as needed */
function fillHands() {}


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