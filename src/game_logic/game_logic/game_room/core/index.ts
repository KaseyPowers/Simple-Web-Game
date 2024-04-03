import { updaters as chatUpdaters } from "./chat";
import { utils as playerUtils, updaters as playerUpdaters } from "./players";
import { utils as roomUtils } from "./room";

// TODO: Use tests to confirm no overlapping keys if we are going to re-export like this
export const gameRoomUtils = {
  ...roomUtils,
  ...playerUtils,
};
export const gameRoomUpdaters = {
  ...chatUpdaters,
  ...playerUpdaters,
} as const;
