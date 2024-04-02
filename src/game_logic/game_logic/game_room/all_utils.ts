import { utils as playerUtils } from "./players";
import { utils as roomUtils } from "./room";
import { utils as managerUtils } from "./room_manager";

// TODO: Use tests to confirm no overlapping keys if we are going to re-export like this
const gameRoomUtils = {
  ...roomUtils,
  ...playerUtils,
  ...managerUtils,
};

export default gameRoomUtils;
