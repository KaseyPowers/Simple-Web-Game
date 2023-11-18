import { UUID } from "../../utils";
import { DeckType, CardDeck } from "./cards";

export interface BasePlayerState { 
    /** Hand is assumed to always be used, will default to a simple array of cards, will need to see how well this can be extended for more specific hand types */
    hand: CardDeck,
    [key: string]: any 
};

export interface BaseGameState {
    playerStates: {
        [key: UUID]:  BasePlayerState
    },

    deck: DeckType,
    discardPile: DeckType,

    /** Catch all */
    [key: string]: any
};