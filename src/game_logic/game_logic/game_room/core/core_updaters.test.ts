// just import the values used/exported here, could potentially import the updaters myself to verify but seems excessive
import {
  chatUpdaterKeys,
  playerUpdaterKeys,
  coreUpdaters,
} from "./core_udpaters";

// import all the utils we use in index and the combined object
import { utils as playerUtils } from "./players";
import { utils as roomUtils } from "./room";
import * as storeUtils from "./store_utils";
import { utils } from "./index";

describe("core_updaters exports keys and combined updaters obj", () => {
  it("updater keys should not overlap at all", () => {
    // to verify that the keys don't overlap, create a set from both, and compare it's length to the length of each keys array
    expect(new Set([...chatUpdaterKeys, ...playerUpdaterKeys]).size).toBe(
      chatUpdaterKeys.length + playerUpdaterKeys.length,
    );
  });
  it("coreUpdaters should contain all updaters from both", () => {
    expect([...chatUpdaterKeys, ...playerUpdaterKeys]).toBeArrayWith(
      Object.keys(coreUpdaters),
    );
  });
});
// didn't seem worth doing a whole extra test file for the simimlar export logic in `index.ts` so putting here
describe("check combined utils", () => {
  // just getting keys defined once to make life easier
  const playerUtilKeys = Object.keys(playerUtils);
  const roomUtilKeys = Object.keys(roomUtils);
  const storeUtilKeys = Object.keys(storeUtils);

  const combinedKeysArr = [
    ...playerUtilKeys,
    ...roomUtilKeys,
    ...storeUtilKeys,
  ];

  const combinedKeysSet = new Set(combinedKeysArr);

  it("each utils should have unique functions", () => {
    expect(combinedKeysSet.size).toBe(
      playerUtilKeys.length + roomUtilKeys.length + storeUtilKeys.length,
    );
  });

  it("utils should contain all utils combined", () => {
    const allUtilsKeys = Object.keys(utils);
    expect(allUtilsKeys).toBeArrayWith(combinedKeysArr);
  });
});
