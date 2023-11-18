import { UUID, ObjectValues } from "../../utils";

import { DeckType } from "./cards";
import {BaseGameState} from "./game_state";

export const gameStateName = "gameState" as const;
/** NOTE: waiting/ready statuses could work, but I think I'll leave out ready, have ready be a selector/computed value of waiting + conditions met */
export const GameStatuses = {
    waiting: "WAITING",
    playing: "PLAYING",
    finished: "FINISHED"
} as const;

type GameStatusTypes = ObjectValues<typeof GameStatuses>;

export interface BaseGameStateDefinition {
    id: UUID,
    name: string, /** Name of the game */
    status: GameStatusTypes, /** the status of the game  */
    players: UUID[], /** Store the array (in order for turn stuff, TODO how to handle prep phase for order to change ) */
    /** TODO: How to define this for best re-usability */
    meta: {
        /** Player Min/Max logic */
        minPlayers: number, /** Minimum players needed to play */
        maxPlayers: number, /** Maximum players the game can support */
        /** Define all cards used by the game
         * TODO: not sure if defining the full set of cards here is best, it makes sense but if large, could cause issues during the reset steps, would need to make sure reset doesn't do unnecisary work re-creating this object
         */
        allCards: DeckType,

        /** Basic attributes around hand sizes, optional in case more complex rules apply */

        // this is used by a basic utility to make sure each players hand has this many cards
        min_hand_size?: number,

        /** Keep this for flexibility */
        [key: string]: any
    },
    /** A common base for the state, but flexible for various types */
    state: BaseGameState
}

export type BaseGameDefinitionInput<GameDef extends BaseGameStateDefinition = BaseGameStateDefinition> = Omit<GameDef, "state">