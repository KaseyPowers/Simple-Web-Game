import { createAction } from "@reduxjs/toolkit";

import { UUID } from "../../utils";
import { BaseGameStateDefinition } from "../../game_definition";
import type { GameObj, GameObjInput } from "./type";

export function createGameObj<T extends BaseGameStateDefinition>(inputObj: GameObjInput<T>): Readonly<GameObj<T>> {

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

const gamesRootName = "games";
export const startGameAction = createAction<UUID[]>([gamesRootName, "startGame"].join("/"));

export const resetGameAction = createAction<{ keepPlaying: boolean }>([gamesRootName, "resetGame"].join("/"));
