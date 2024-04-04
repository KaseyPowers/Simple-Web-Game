import { gameRoomUpdaters } from "../core";
import { mapToStoreUpdaters } from "./store_updater";
export * as managerUtils from "./utils";

// convert the gameRoomUpdaters to ones with store updating
export const storeUpdaters = mapToStoreUpdaters(gameRoomUpdaters);
