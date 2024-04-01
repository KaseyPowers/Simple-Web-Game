import { utils as roomUtils } from "./room";
import { utils as playerUtils, eventFns as playerEvents } from "./players";

// TODO: Use tests to confirm no overlapping keys if we are going to re-export like this
export const utils = {
  ...roomUtils,
  ...playerUtils,
};
export const eventFns = {
  ...playerEvents,
};
