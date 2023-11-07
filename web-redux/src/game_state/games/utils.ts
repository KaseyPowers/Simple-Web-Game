import { createAction, createSelector } from "@reduxjs/toolkit";

import { AppThunk } from "../../app/store";
import type { UUID } from "../../utils";
import type { BaseGameDefinition } from "../type";
import { gameStateName, GameStatuses } from "../type";
import type { GameObj, GameObjInput } from "./type";

export function createGameObj<T extends BaseGameDefinition>(inputObj: GameObjInput<T>): Readonly<GameObj<T>> {

    const { slice, Component, View, ...rest } = inputObj;

    const initialState = slice.getInitialState();
    const { id, name } = initialState;

    const base = {
        ...rest,
        id, name, slice
    };

    if (Component) {
        return {
            ...base,
            Component
        };
    }
    if (View) {
        if ("Playing" in View) {
            return {
                ...base,
                View
            };
        }
        return {
            ...base,
            View: {
                Playing: View
            }
        };
    }
    throw new Error("Must define a Component or View");
}

export const startGameAction = createAction<UUID[]>([gameStateName, "startGame"].join("/"));

export const resetGameAction = createAction<{ keepPlaying: boolean, resetPlayers: UUID[] }>([gameStateName, "resetGame"].join("/"));

export const resetGame = (keepPlaying: boolean): AppThunk => (dispatch, getState) => {

    const currentGameState = getState()[gameStateName];

    /** Fot not-waiting to catch playing+finished */
    const currentlyPlaying = currentGameState.status !== GameStatuses.waiting;
    const useKeepPlaying = keepPlaying && currentlyPlaying;

    dispatch(resetGameAction({
        keepPlaying: useKeepPlaying,
        resetPlayers: useKeepPlaying ? [] : currentGameState.players
    }));
}
