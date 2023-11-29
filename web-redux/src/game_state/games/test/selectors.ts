import { createSelector } from "@reduxjs/toolkit";
import {getGameSelectors} from "../selectors";
import {id} from "./test_slice";

import {PromptPlayerStateProfile, DerivedPromptPlayerState} from "./types";
import { PromptGameState } from "../../../game_definition";

const {gamePlayersSelector, gameStateSelector} = getGameSelectors(id);

export const roundStateSelector = createSelector(gameStateSelector, state => (state as PromptGameState).round);

export const derivedPlayerStateSelector = createSelector(gamePlayersSelector, roundStateSelector, (players, round): DerivedPromptPlayerState[] => {
    return players.map((player, index) => {
        return {
            ...(player as PromptPlayerStateProfile),
            derived: {
                isJudge: index === round.currentJudge
            }
        }
    });
});

export {
    gameStateSelector,
    gamePlayersSelector
};