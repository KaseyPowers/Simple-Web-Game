import type { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import type { PartPartial } from "../../utils";
import type { BaseGameState } from "../type";
import type { GameObj } from "./type";

export function createGameObj<T extends BaseGameState>(inputObj: PartPartial<GameObj<T>, "id" | "name">): GameObj<T> {

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
        return {
            ...base,
            View
        };
    }
    throw new Error("Must define a Component or View");
}

export function createResetReducer<T extends BaseGameState>(initState: T): CaseReducer<T, PayloadAction<{ keepPlayers?: boolean }>> {
    return (state, action) => {
        // payload to reset 
        if (action.payload.keepPlayers) {
            return {
                ...initState,
                players: state.players
            };
        }
        return initState;
    }
}