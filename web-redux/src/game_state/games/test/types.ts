
import {PlayerGameStateProfile, PromptPlayerState} from "../../../game_definition";

export type PromptPlayerStateProfile = PlayerGameStateProfile<PromptPlayerState>;

export type DerivedPromptPlayerState = PromptPlayerStateProfile & {
    derived: {
        isJudge: boolean
    }
}
