// re-export all core updaters here

import { updaters as chatUpdaters } from "./chat";
import { updaters as playerUpdaters } from "./players";

export type ChatUpdaterKeys = keyof typeof chatUpdaters;
export const chatUpdaterKeys = Object.keys(chatUpdaters) as ChatUpdaterKeys[];
export type PlayerUpdaterKeys = keyof typeof playerUpdaters;
export const playerUpdaterKeys = Object.keys(
  playerUpdaters,
) as PlayerUpdaterKeys[];
export const coreUpdaters = {
  ...chatUpdaters,
  ...playerUpdaters,
} as const;
