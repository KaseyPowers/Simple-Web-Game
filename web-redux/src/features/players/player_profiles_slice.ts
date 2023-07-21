import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from '../../app/store';

import type { UUID, BaseUUIDItem } from "../../utils";
import { ObjectValues, NormalizedState, generateUUID, createNormalized } from '../../utils';

export const PlayerStatuses = {
  watching: "WATCHING",
  waiting: "WAITING",
  playing: "PLAYING"
} as const;
type PlayerStatusTypes = ObjectValues<typeof PlayerStatuses>

export interface PlayerProfile extends BaseUUIDItem {
  status: PlayerStatusTypes,
  name: string
}
export const defaultPlayerStatus = PlayerStatuses.waiting;
export type InputPlayerProfile = Omit<PlayerProfile, "id" | "status"> & Partial<Pick<PlayerProfile, "status">>;

/** Function to generate a new player profile, existing Ids just forced to default to empty array for consistency */
export function createPlayerProfile(input: InputPlayerProfile, existingIds: PlayerProfile["id"][] = []): PlayerProfile {
  return {
    status: defaultPlayerStatus, /** Providing a default player status but let it be overridden */
    ...input,
    id: generateUUID(existingIds),
  };
}


export type PlayerProfileState = NormalizedState<PlayerProfile>;

const tempInitPlayers: PlayerProfile[] = [];
const tempInitPlayerIds = (): UUID[] => tempInitPlayers.map(player => player.id);

tempInitPlayers.push(createPlayerProfile({ name: "A-Name" }, tempInitPlayerIds()));
tempInitPlayers.push(createPlayerProfile({ name: "B-Name" }, tempInitPlayerIds()));
tempInitPlayers.push(createPlayerProfile({ name: "C-Watcher-Name", status: PlayerStatuses.watching, }, tempInitPlayerIds()));
tempInitPlayers.push(createPlayerProfile({ name: "D-Playing-Name", status: PlayerStatuses.playing, }, tempInitPlayerIds()));

export const initialState: PlayerProfileState = createNormalized(tempInitPlayers);

export const playerProfilesSlice = createSlice({
  name: "players",
  initialState,
  reducers: {
    addPlayer: (state, action: PayloadAction<PlayerProfile>) => {
      state.byId[action.payload.id] = action.payload;
      state.allIds.push(action.payload.id);
    }
  }
});
export const { addPlayer } = playerProfilesSlice.actions;


export const addNewPlayerProfile = (input: InputPlayerProfile): AppThunk =>
  (dispatch, getState) => {
    const newPlayer = createPlayerProfile(input, getState().players.allIds);
    dispatch(addPlayer(newPlayer));
  }

/**
 * This function is a selector used to convert the player profiles state back into an array, using the order in the allIds array.
 */
export const playerProfiles = (state: RootState) => {
  const { byId, allIds } = state.players;
  return allIds.map(id => byId[id]);
}

export default playerProfilesSlice.reducer;
