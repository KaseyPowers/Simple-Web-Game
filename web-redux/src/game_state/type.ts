import type { Reducer } from "redux";

import { ObjectValues, UUID, BaseUUIDItem } from '../utils';

export const gameStateName = "gameState" as const;
/** NOTE: waiting/ready statuses could work, but I think I'll leave out ready, have ready be a selector/computed value of waiting + conditions met */
export const GameStatuses = {
    waiting: "WAITING",
    playing: "PLAYING",
    finished: "FINISHED"
} as const;

type GameStatusTypes = ObjectValues<typeof GameStatuses>;

/** In case we add to this */
export type BaseCardType = BaseUUIDItem;

export type CardDeck<CardType extends BaseUUIDItem> = CardType[];

export type DeckType<CardType extends BaseUUIDItem> = CardDeck<CardType> | { [key: string]: CardDeck<CardType> };

export interface BaseGameState<PlayerState extends any, Card extends BaseCardType, Deck extends DeckType<Card> = DeckType<Card>> {
    playerStates: Record<UUID, PlayerState>,
    deck: Deck,
    discardPile: Deck,
    /** Catch all */
    [key: string]: any
}

export interface BaseGameDefinition<PlayerState extends any, Card extends BaseCardType, Deck extends DeckType<Card>, GameState extends BaseGameState<PlayerState, Card, Deck> = BaseGameState<PlayerState, Card, Deck>> {
    id: UUID,
    name: string, /** Name of the game */
    status: GameStatusTypes, /** the status of the game  */
    players: UUID[], /** Store the array (in order for turn stuff, TODO how to handle prep phase for order to change ) */
    /** TODO: How to define this for best re-usability */
    meta: {
        /** Player Min/Max logic */
        minPlayers: number, /** Minimum players needed to play */
        maxPlayers: number, /** Maximum players the game can support */

        allCards: GameState["deck"]

        /** Keep this for flexibility */
        [key: string]: any
    },
    /** A common base for the state, but flexible for various types */
    state: GameState
}

export type GameDefinitionReducer<PlayerState extends any, Card extends BaseCardType, Deck extends DeckType<Card>, GameState extends BaseGameState<PlayerState, Card, Deck>, GameDef extends BaseGameDefinition<PlayerState, Card, Deck, GameState> = BaseGameDefinition<PlayerState, Card, Deck, GameState>> = Reducer<GameDef>
