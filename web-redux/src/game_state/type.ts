import type { Reducer } from "redux";

import { ObjectValues, UUID } from '../utils';

export const gameStateName = "gameState" as const;
/** NOTE: waiting/ready statuses could work, but I think I'll leave out ready, have ready be a selector/computed value of waiting + conditions met */
export const GameStatuses = {
    waiting: "WAITING",
    playing: "PLAYING",
    finished: "FINISHED"
} as const;
type GameStatusTypes = ObjectValues<typeof GameStatuses>;

/** the base data, what will be shared by all games */
export interface BaseGameState {
    id: UUID,
    name: string, /** Name of the game */
    status: GameStatusTypes, /** the status of the game  */
    players: UUID[], /** Store the array (in order for turn stuff, TBD how to handle prep phase for order to change ) */
    /** TODO: How to define this for best re-usability */
    meta: {
        /** Player Min/Max logic */
        minPlayers: number, /** Minimum players needed to play */
        maxPlayers: number, /** Maximum players the game can support */

        /** Keep this for flexibility */
        [key: string]: any
    },
    /** A common base for the state, but flexible for various types */
    state: {
        [key: string]: any
    }
}

export type GameStateReducer = Reducer<BaseGameState>
