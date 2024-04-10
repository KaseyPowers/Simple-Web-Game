import type { Updater } from "~/game_logic/updater_types";
import { copyUpdater } from "~/game_logic/updater";
import type { GameRoomDataI } from "~/game_logic/game_room/core/types";
import { updaters } from "~/game_logic/game_room/core";

type UpdatersKeyType = keyof typeof updaters;
type UpdatersFnType = (typeof updaters)[UpdatersKeyType];

// re-export the type here just for consistency
export type CoreUpdaterHelpers = typeof updaters;
// get and return a copy of the updaters for this socket
export default function getCoreUpdaterHelpers() {
  const entries = Object.entries(updaters) as [
    UpdatersKeyType,
    UpdatersFnType,
  ][];
  const entriesCopy = entries.map(([key, updater]) => [
    key,
    copyUpdater(updater as Updater<GameRoomDataI, unknown[], string>),
  ]);
  return Object.fromEntries(entriesCopy) as typeof updaters;
}
