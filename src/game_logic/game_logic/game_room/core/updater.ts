import type { GameRoomDataI } from "./room";
import type { UpdaterResponse, UpdaterFnInput } from "../../updater_types";
import { basicInputParser, createUpdaterBuilder } from "../../updater";

export type GameRoomResponse = UpdaterResponse<GameRoomDataI>;
export type GameRoomInputType = UpdaterFnInput<GameRoomDataI>;

const { createUpdater } = createUpdaterBuilder<GameRoomDataI>();

export { createUpdater };
