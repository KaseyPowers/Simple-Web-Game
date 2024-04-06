// re-export all core updaters here

import { updaters as chatUpdaters } from "./chat";
import { updaters as playerUpdaters } from "./players";

export const chatUpdaterKeys = Object.keys(
  chatUpdaters,
) as (keyof typeof chatUpdaters)[];
export const playerUpdaterKeys = Object.keys(
  playerUpdaters,
) as (keyof typeof playerUpdaters)[];
export const coreUpdaters = {
  ...chatUpdaters,
  ...playerUpdaters,
} as const;
