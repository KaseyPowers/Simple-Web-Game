import { utils as playerUtils, eventFns as playerEvents } from "./players";
import { utils as roomUtils } from "./room";
import { utils as managerUtils } from "./room_manager";

// TODO: Use tests to confirm no overlapping keys if we are going to re-export like this
export const utils = {
  ...roomUtils,
  ...playerUtils,
  ...managerUtils,
};
export const eventFns = {
  ...playerEvents,
};
