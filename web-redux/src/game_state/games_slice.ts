import type { PayloadAction } from "@reduxjs/toolkit";
import { combineReducers, createSlice } from "@reduxjs/toolkit";

import { UUID } from "../utils";

import {allGames, allGameIds, GameObjIds, defaultGameId, allGamesReducer} from "./games/all_games";

const gameSelectorName = "gameSelection" as const;

const initialSelectorState: {
    gameOptions: GameObjIds[],
    selected: GameObjIds
} = {
    gameOptions: allGameIds,
    selected: defaultGameId
}

export function idIsGameID(id: UUID): id is GameObjIds {
    return (
      !!id &&
      allGameIds.includes(id as GameObjIds) &&
      typeof allGames[id as GameObjIds] !== "undefined"
    );
  }

export const gameSelectorSlice = createSlice({
    name: gameSelectorName,
    initialState: initialSelectorState,
    reducers: {
        setSelectedGame: (state, action: PayloadAction<GameObjIds>) => {
            let newGameId: GameObjIds = defaultGameId;
            if (idIsGameID(action.payload)) {
                newGameId = action.payload
            }
            if (state.selected !== newGameId) {
                state.selected = newGameId;
            }
        }
    }
});

export default combineReducers({
    [gameSelectorName]: gameSelectorSlice.reducer,
    games: allGamesReducer
});