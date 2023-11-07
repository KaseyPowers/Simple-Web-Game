import { createSelector } from '@reduxjs/toolkit';

import { UUID } from '../utils';

import { RootState } from "../app/store";

import { selectPlayerProfilesById } from "../features/players/player_profiles_selectors";

import { BaseGameDefinition, BaseGameState, gameStateName, BaseCardType, DeckType, DeckKeysType, MultiDeck } from "./type";

/** Common selectors */
export const selectGameState = (state: RootState) => state[gameStateName];

export const selectGameID = createSelector(selectGameState, (state) => state.id);
export const selectGameName = createSelector(selectGameState, (state) => state.name);
export const selectGameStatus = createSelector(selectGameState, (state) => state.status);
export const selectGamePlayerIds = createSelector(selectGameState, (state) => state.players);
export const selectGameMeta = createSelector(selectGameState, (state) => state.meta);

export const selectGameStateState = createSelector(selectGameState, (state) => state.state);
export const selectGamePlayerStates = createSelector(selectGameStateState, state => state.playerStates);

export const selectGamePlayers = createSelector(selectGamePlayerIds, selectPlayerProfilesById, selectGamePlayerStates,  (ids: string[], profilesById, playerStates) => ids.map(id => ({...profilesById[id], state: playerStates[id]})));

export function initialGameStateBuilder<
    DeckKeys extends DeckKeysType = null,
    GameState extends BaseGameState = BaseGameState
>
(initialPlayerState: GameState["playerStates"][UUID], deckKeys: DeckKeys extends string ? DeckKeys[] : undefined) {
    function getEmptyDeck() {
        if (deckKeys) {
            return deckKeys.reduce((output, key) => {
                output[key] = [];
                return output;
            }, {} as { [key: string]: any[]})
        }
        return [];
    }
    return function getInitialGameState<GameDef extends BaseGameDefinition<GameState> = BaseGameDefinition<GameState>>(gameDef: GameDef): GameState {

        const output: GameState = {
            playerStates: {},
            deck: getEmptyDeck(),
            discardPile: getEmptyDeck()
        };
        return output;
    }
}