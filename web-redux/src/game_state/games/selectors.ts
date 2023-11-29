import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { UUID } from "../../utils";
import { selectPlayerProfilesById } from "../../features/players/player_profiles_selectors";

import {GameObjIds} from "./all_games";

export const allGamesStates = (state:RootState) => state.games.games;


export const getGameSelectors = (id: GameObjIds) => {

    const gameDefStateSelector = createSelector(allGamesStates, games => games[id]);

    const gameStateSelector = createSelector(gameDefStateSelector, gameDef => gameDef.state);

    const playerIds = createSelector(gameDefStateSelector, gameDef => gameDef.players);

    const playerStates = createSelector(gameStateSelector, state => state.playerStates);

    const gamePlayersSelector = createSelector(playerIds, selectPlayerProfilesById, playerStates, (ids: UUID[], profilesById, playerStates) => ids.map(id => ({...profilesById[id], state: playerStates[id]})));


    return {
        gameDefStateSelector,
        gameStateSelector,
        gamePlayersSelector
    };
}