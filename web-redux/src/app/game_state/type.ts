import type { Reducer } from "redux";

import { ObjectValues, UUID } from '../../utils';

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
    players: UUID[],
    /** How to define this for best re-usability */
    meta?: {
        [key: string]: any
    },
    /** A common base for the state, but flexible for various types */
    state: {
        [key: string]: any
    }
}

export type GameStateReducer = Reducer<BaseGameState>
