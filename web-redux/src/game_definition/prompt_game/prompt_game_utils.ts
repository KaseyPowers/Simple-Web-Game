
import { BaseGameDefinitionInput, getEmptyGameState, initPlayerStates, initStateDecks, fillHands } from "../base_logic";
import {PromptGameState, PromptGameStateDefinition, PromptPlayerState, CardTypeKeys, PromptCard, AnswerCard} from "./prompt_game_types"; 
import { shuffle } from "../../utils";

export const EmptyPromptCard: PromptCard = {
    id: "null",
    type: CardTypeKeys.PROMPT,
    value: null,
};

const emptyPromptPlayerState: PromptPlayerState = {
    wonHands: [],
    hand: []
};

// TODO: Determine if this const is needed or just used by the initial state
const emptyRound: PromptGameState["round"] = {
    /** Judge number invalid to indicate it's a filler not to use */
    currentJudge: -1,
    prompt: EmptyPromptCard,
    playersCards: {}
};

export function getEmptyPromptGameState<GameDef extends PromptGameStateDefinition>(gameDefInput: BaseGameDefinitionInput<GameDef>): PromptGameState {
    const baseEmptyState = getEmptyGameState(gameDefInput);
    return {
        ...baseEmptyState,
        /** Default judge to index 0 */
        round: emptyRound
    };
}

export function getInitialPromptGameState<GameDef extends PromptGameStateDefinition>(gameDefInput: BaseGameDefinitionInput<GameDef>): PromptGameState {
    const {players} = gameDefInput;

    return {
        playerStates: initPlayerStates<PromptPlayerState>(players, emptyPromptPlayerState),
        ...initStateDecks(gameDefInput),
        /** Default judge to index 0 */
        round: emptyRound
    };
}

/**
 * assuming the deck's have been initiated, will draw the first card from the appropriate deck.
 * If the deck is empty, will try to shuffle the discard pile's deck back into the main
 * NOTE: creating 2 functions because typescript was making a type argument input difficult
 */
function drawCard<GameDef extends PromptGameStateDefinition>(gameDef: GameDef, reshuffle: boolean = true): AnswerCard {
    if (gameDef.state.deck[CardTypeKeys.ANSWER].length <= 0) {
        if (!reshuffle) {
            throw new Error("Attempting to draw a card from an empty deck with reshuffle = false");
        }  
        if (gameDef.state.discardPile[CardTypeKeys.ANSWER].length <= 0) {
            throw new Error("Attempted to reshuffle discard pile, but it is empty");
        }
        gameDef.state.deck[CardTypeKeys.ANSWER] = shuffle(gameDef.state.discardPile[CardTypeKeys.ANSWER]);
        gameDef.state.discardPile[CardTypeKeys.ANSWER] = [];
    }
    const output = gameDef.state.deck[CardTypeKeys.ANSWER].shift();

    if (!output) {
        throw new Error("Checked for reshuffling but shift() still returned unedfined");
    }

    return output;
}

export function fillPromptHands<GameDef extends PromptGameStateDefinition>(gameDef: GameDef) {
    return fillHands(gameDef, drawCard);
}


function drawPromptCard<GameDef extends PromptGameStateDefinition>(gameDef: GameDef, reshuffle: boolean = true): PromptCard {
    if (gameDef.state.deck[CardTypeKeys.PROMPT].length <= 0) {
        if (!reshuffle) {
            throw new Error("Attempting to draw a card from an empty deck with reshuffle = false");
        }  
        if (gameDef.state.discardPile[CardTypeKeys.PROMPT].length <= 0) {
            throw new Error("Attempted to reshuffle discard pile, but it is empty");
        }
        gameDef.state.deck[CardTypeKeys.PROMPT] = shuffle(gameDef.state.discardPile[CardTypeKeys.PROMPT]);
        gameDef.state.discardPile[CardTypeKeys.PROMPT] = [];
    }

    const output = gameDef.state.deck[CardTypeKeys.PROMPT].shift();

    if (!output) {
        throw new Error("Checked for reshuffling but shift() still returned unedfined");
    }

    return output;
}

export function createNextPromptRound<GameDef extends PromptGameStateDefinition>(gameDef: GameDef) {
    // ignore the discarding of old prompt card, assume it's being held in a player's wonHands value
    // draw the next prompt card
    gameDef.state.round = {        
        // increment the judge's index
        currentJudge: (gameDef.state.round.currentJudge + 1) % gameDef.players.length,
        prompt: drawPromptCard(gameDef),
        playersCards: {}
    };
}
