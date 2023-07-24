import { nanoid } from '@reduxjs/toolkit';
import playerProfilesReducer, {
  initialState,
  createPlayerProfile,
  PlayerStatuses,
  defaultPlayerStatus,
  addPlayer,
} from './player_profiles_slice';

import type {
  PlayerProfile,
  PlayerProfileState
} from "./player_profiles_slice";


import { createNormalized } from "../../utils";

const testInitPlayers: PlayerProfile[] = [];
testInitPlayers.push(createPlayerProfile({ name: "A-Test-Name" }));
testInitPlayers.push(createPlayerProfile({ name: "A-Test-B-Name" }));
testInitPlayers.push(createPlayerProfile({ name: "Wow-Testing-A-Watcher-Name", status: PlayerStatuses.watching, }));

describe('player profiles reducer', () => {
  const testInitialState: PlayerProfileState = createNormalized(testInitPlayers);

  it('should make sure test initial state is not accidentally matching actual initial state', () => {
    expect(testInitialState).not.toEqual(initialState);
  })

  it('should handle initial state', () => {
    expect(playerProfilesReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  /** Note: new players will have (usually) random UUIDs so can't do a true equality check */
  it('should handle addPlayer (with just name, default status)', () => {
    const newPlayer = {
      id: nanoid(),
      name: "test-adding-name",
      status: PlayerStatuses.waiting
    };
    const actual = playerProfilesReducer(testInitialState, addPlayer(newPlayer));
    /** We know testInitialState used 3 players, so check for 4 ids */
    expect(actual.allIds).toHaveLength(4);
    expect(actual.allIds).toContain(newPlayer.id);
    expect(actual.byId[newPlayer.id]).toEqual(newPlayer);
  });

});
