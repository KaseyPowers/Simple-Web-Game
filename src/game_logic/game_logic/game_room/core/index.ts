import { utils as playerUtils } from "./players";
import { utils as roomUtils } from "./room";
import * as storeUtils from "./store_utils";

// re-export (the wrapped) updaters from store_updater
export { storeUpdaters as updaters } from "./store_updater";
// re-export the updater keys
export { chatUpdaterKeys, playerUpdaterKeys } from "./core_udpaters";
// TODO: Use tests to confirm no overlapping keys if we are going to re-export like this
export const utils = {
  ...roomUtils,
  ...playerUtils,
  ...storeUtils,
};
