import { PlayerProfile } from "../features/players/player_profiles_slice";
import {BasePlayerState} from "./base_logic";

export type PlayerGameStateProfile<PlayerState extends BasePlayerState> = PlayerProfile & {
    state: PlayerState
};