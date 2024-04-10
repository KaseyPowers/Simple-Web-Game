import type { GameRoomDataI } from "./types";
import type {
  UpdaterResponse,
  UpdaterFnInput,
} from "~/game_logic/updater_types";
import { createUpdaterBuilder } from "~/game_logic/updater";

export type GameRoomResponse = UpdaterResponse<GameRoomDataI>;
export type GameRoomInputType = UpdaterFnInput<GameRoomDataI>;

const { createUpdater } = createUpdaterBuilder<GameRoomDataI>();

export { createUpdater };
