import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from '../store';

import { ObjectValues } from '../../utils';

export const GameStatuses = {
  preparing: "PREPARING",
  started: "STARTED",
  finished: "FINISHED"
} as const;
type GameStatusTypes = ObjectValues<typeof GameStatuses>

export interface GameStatusState {
  status: GameStatusTypes
}

const initialState: GameStatusState = {
  status: GameStatuses.preparing,
}

export const gameStatusSlice = createSlice({
  name: "gameStatus",
  initialState,
  reducers: {

  },
});
// export const { addPlayer } = playerProfilesSlice.actions;

/**
 * This function is a selector used to get the gameStatus
 */
export const gameStatus = (state: RootState) => {
  const { status } = state.gameStatus;
  return status;
}

export default gameStatusSlice.reducer;
