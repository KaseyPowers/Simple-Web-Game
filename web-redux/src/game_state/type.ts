import type { Reducer } from "redux";

import { ObjectValues, UUID } from '../utils';

import type { PlayerProfile } from "../features/players/player_profiles_slice";

export const gameStateName = "gameState" as const;
/** NOTE: waiting/ready statuses could work, but I think I'll leave out ready, have ready be a selector/computed value of waiting + conditions met */
export const GameStatuses = {
    waiting: "WAITING",
    playing: "PLAYING",
    finished: "FINISHED"
} as const;
type GameStatusTypes = ObjectValues<typeof GameStatuses>;

/** the base data, what will be shared by all games */
export interface BaseGameState<PlayerState extends any = any> {
    id: UUID,
    name: string, /** Name of the game */
    status: GameStatusTypes, /** the status of the game  */
    players: UUID[], /** Store the array (in order for turn stuff, TODO how to handle prep phase for order to change ) */
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
        /** Assume playerState object to define information for the current game state for that player. Optional since it can't be defined until players are added */
        playerStates: Record<UUID, PlayerState>,
        [key: string]: any,        
    }
}

/** TODO: better? */
export type PlayerGameStateProfile<T extends BaseGameState> = PlayerProfile & {
    state: T["state"]["playerStates"][UUID]
};

export type GameStateReducer = Reducer<BaseGameState>
