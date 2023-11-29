
import { UUID, shuffle } from "../../utils";
import { BaseCardType, DeckType, MultiDeck } from "./cards";
import {BaseGameStateDefinition, BaseGameDefinitionInput} from "./game_definition";
import { BasePlayerState } from "./game_state";


export function initStateDecks<GameDef extends BaseGameStateDefinition>(gameDefInput: BaseGameDefinitionInput<GameDef>): Pick<GameDef["state"], "discardPile" | "deck"> {
    const {meta} = gameDefInput;   
    const {allCards} = meta;
    
    let discardPile: DeckType = [];
    let deck: DeckType = [];

    if (Array.isArray(allCards)) {
        deck = shuffle(allCards);
    } else {
        const deckKeys = Object.keys(allCards);
        discardPile = deckKeys.reduce((discard, key) => {
            discard[key] = [];
            return discard;
        }, {} as MultiDeck);

        deck = deckKeys.reduce((newDeck, key) => {
            newDeck[key] = shuffle(allCards[key]);
            return newDeck;
        }, {} as MultiDeck);
    }

    return {
        discardPile,
        deck
    };
}

export function emptyStateDecks<GameDef extends BaseGameStateDefinition>(gameDefInput: BaseGameDefinitionInput<GameDef>): Pick<GameDef["state"], "discardPile" | "deck"> {
    const {meta} = gameDefInput;   
    const {allCards} = meta;
    
    let discardPile: DeckType = [];
    let deck: DeckType = [];

    if (!Array.isArray(allCards)) {
        const deckKeys = Object.keys(allCards);

        discardPile = deckKeys.reduce((discard, key) => {
            discard[key] = [];
            return discard;
        }, {} as MultiDeck);

        deck = deckKeys.reduce((newDeck, key) => {
            newDeck[key] = [];
            return newDeck;
        }, {} as MultiDeck);
    }

    return {
        discardPile,
        deck
    };
}

// export type initPlayerStateFn<GameDef extends BaseGameStateDefinition> = (id: UUID, gameDef: BaseGameDefinitionInput<GameDef>) => GameDef["state"]["playerStates"][keyof GameDef["state"]["playerStates"]];

type emptyPlayerStateType<PlayerState extends BasePlayerState> = PlayerState | (() => PlayerState);

export function initPlayerStates<PlayerState extends BasePlayerState>(players: UUID[], emptyPlayerState: emptyPlayerStateType<PlayerState> ): Record<UUID, PlayerState> {

    const getEmpty =  typeof emptyPlayerState === "function" ? emptyPlayerState : () => ({...emptyPlayerState});

    return players.reduce((output, id) => {
        output[id] = getEmpty();
        return output;
    }, {} as Record<UUID, PlayerState>);
}


export type GameDefPlayerState<GameDef extends BaseGameStateDefinition> = GameDef["state"]["playerStates"][keyof GameDef["state"]["playerStates"]]

/** 
 * This creates a new initial game state.
 * NOTE: assume it is only called when we want that new state returned. 
 * basically, will not be checking if the game status or other values to determine if the state should be populated, will just work with the players + Meta data
 */
export function getInitialGameState<GameDef extends BaseGameStateDefinition>(gameDefInput: BaseGameDefinitionInput<GameDef>, emptyPlayerState: emptyPlayerStateType<GameDefPlayerState<GameDef>>): GameDef["state"] {
    const {players} = gameDefInput;
    return {
        playerStates: initPlayerStates<GameDefPlayerState<GameDef>>(players, emptyPlayerState),
        ...initStateDecks(gameDefInput)
    };
}


export function getEmptyGameState<GameDef extends BaseGameStateDefinition>(gameDefInput: BaseGameDefinitionInput<GameDef>): GameDef["state"] {
    return {
        playerStates: {},
        ...emptyStateDecks(gameDefInput)
    };
}


/** Fill the players hands until they are all full */

/** 
 * drawCardFn will update the state to remove the card and return the new card to use. 
 * using a fn like this to handle logic around re-shuffling the discard pile back into the deck
 */
type drawCardFn<GameDef extends BaseGameStateDefinition> = (gameDef: GameDef) => BaseCardType

export function fillHands<GameDef extends BaseGameStateDefinition>(gameDef: GameDef, drawCard: drawCardFn<GameDef>) {
    const {players, meta} = gameDef;
    const {minHandSize} = meta;

    if (!gameDef.state.playerStates) {
        throw new Error("Should only be calling this function for games using playerState")
    }

    if (typeof minHandSize !== "number") {
        throw new Error("should only be calling this function with 'minHandSize' defined");
    }

    players.forEach(playerId => {
        if (!gameDef.state.playerStates[playerId]) {
            throw new Error("Missing player state object for this playerID");
        }
        /** Assuming an array hand */
        while(gameDef.state.playerStates[playerId].hand.length < minHandSize) {
            const newCard = drawCard(gameDef);
            gameDef.state.playerStates[playerId].hand.push(newCard);
        }        
    });

    return gameDef;
}