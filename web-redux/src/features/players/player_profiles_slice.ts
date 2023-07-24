import { createSlice, PayloadAction, nanoid, createSelector } from '@reduxjs/toolkit';
import { AppThunk, RootState } from '../../app/store';
import { selectGameStatus } from "../../app/game_state/utils";


import type { BaseUUIDItem, MakeInputType } from "../../utils";
import { ObjectValues, NormalizedState, createNormalized } from '../../utils';

export const PlayerStatuses = {
  watching: "WATCHING",
  waiting: "WAITING",
  playing: "PLAYING"
} as const;
export type PlayerStatusTypes = ObjectValues<typeof PlayerStatuses>;
export const defaultPlayerStatus = PlayerStatuses.waiting;

export interface PlayerProfile extends BaseUUIDItem {
  status: PlayerStatusTypes,
  name: string
}

export type InputPlayerProfile = MakeInputType<PlayerProfile, "id", "status">;

/** Function to generate a new player profile, existing Ids just forced to default to empty array for consistency */
export function createPlayerProfile(input: InputPlayerProfile): PlayerProfile {
  return {
    status: defaultPlayerStatus, /** Providing a default player status but let it be overridden */
    ...input,
    id: nanoid(),
  };
}

export type PlayerProfileState = NormalizedState<PlayerProfile>;

const tempInitPlayers: PlayerProfile[] = [];
tempInitPlayers.push(createPlayerProfile({ name: "A-Name" }));
tempInitPlayers.push(createPlayerProfile({ name: "B-Name" }));
tempInitPlayers.push(createPlayerProfile({ name: "C-Watcher-Name", status: PlayerStatuses.watching, }));

export const initialState: PlayerProfileState = createNormalized(tempInitPlayers);

export const playerProfilesSlice = createSlice({
  name: "players",
  initialState,
  reducers: {
    updateStatuses: (state, action: PayloadAction<{ ids: PlayerProfile["id"][], status: PlayerStatusTypes }>) => {
      action.payload.ids.forEach((id) => {
        state.byId[id].status = action.payload.status;
      });
    },
    addPlayer: {
      reducer: (state, action: PayloadAction<PlayerProfile>) => {
        state.byId[action.payload.id] = action.payload;
        state.allIds.push(action.payload.id);
      },
      prepare: (input: InputPlayerProfile) => ({
        payload: createPlayerProfile(input)
      })
    }
  },
});
export const { addPlayer, updateStatuses } = playerProfilesSlice.actions;

/**
 * This function is a selector used to convert the player profiles state back into an array, using the order in the allIds array.
 */
const selectPlayerProfilesState = (state: RootState) => state.players;
const selectPlayerProfilesById = createSelector(selectPlayerProfilesState, state => state.byId);
const selectPlayerProfileIds = createSelector(selectPlayerProfilesState, state => state.allIds);
export const selectPlayerProfiles = createSelector([selectPlayerProfilesById, selectPlayerProfileIds], (byId, allIds) => {
  return allIds.map(id => byId[id]);
})

/** TODO: a selector with game state to check for exceptions when allowing/blocking users switching to playing */
export const setPlayerStatus = (players: PlayerProfile["id"] | PlayerProfile["id"][], status: PlayerStatusTypes): AppThunk =>
  (dispatch, getState) => {
    const playersState = getState().players;
    const isPlaying = selectGameStatus(getState());

    let toSet: PlayerProfile["id"][] = [];
    // first get ids into an array
    toSet = toSet.concat(players);
    /** If any Ids invalid, throw error */
    if (toSet.some(id => !playersState.allIds.includes(id))) {
      throw new Error("Invalid player id provided");
    }
    /** Using filter to keep any ids that have valid changes */
    toSet.filter(id => {
      const currentStatus = playersState.byId[id].status;
      /** make sure the status would actually change */
      if (currentStatus !== status) {


        // start with isPlaying stoppers
        if (isPlaying) {
          // don't let them move from playing if game is going on
          if (currentStatus === PlayerStatuses.playing) {
            return false;
          }
          /** TODO: handle how to set players to playing at the start of the game, like verify they are listed players in the game state */
        }

        /** Swtiching between non-playing status is never blocked */
        if ([currentStatus, status].every(checkVal => checkVal !== PlayerStatuses.playing)) {
          return true;
        }
      }
      /** Return false to catch */
      return false;
    });

    if (toSet.length <= 0) {
      console.warn("Attempted to update player statuses, but none were able to update");
    } else {
      dispatch(updateStatuses({ ids: toSet, status }))
    }




  }

export default playerProfilesSlice.reducer;
