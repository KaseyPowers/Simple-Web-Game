import { updaters } from "~/game_logic/game_room/core";
import getCoreUpdaterHelpers from "./core_updaters";

const updatersKeys = Object.keys(updaters) as (keyof typeof updaters)[];

describe("getCoreUpdaterHelpers", () => {
  it("should return a copy of updaters", () => {
    const helpers = getCoreUpdaterHelpers();
    // deep equality doesn't work with the bound obj type it seems, so let's get fancier
    // first check the keys match
    expect(Object.keys(helpers)).toBeArrayWith(updatersKeys);

    updatersKeys.forEach((key) => {
      expect(helpers[key].inputParser).toBe(updaters[key].inputParser);
      expect(helpers[key].onChangeFns).toEqual(updaters[key].onChangeFns);
      expect(helpers[key].coreInnerFn).toBe(updaters[key].coreInnerFn);
      expect(helpers[key].innerFn).toBe(updaters[key].innerFn);
      expect(helpers[key].update).toBe(updaters[key].update);
    });
  });

  it("adding changeFns to helpers won't effect updaters", () => {
    const helpers = getCoreUpdaterHelpers();
    updatersKeys.forEach((key) => {
      // generate a different onChangeFn for each helper
      helpers[key].onChangeFns.push((room) => {
        // log just to do something in function even though it shouldn't get called
        console.log(room.roomId + key);
      });
    });

    updatersKeys.forEach((key) => {
      expect(helpers[key].inputParser).toBe(updaters[key].inputParser);
      // we expect them not to match since we changed the helpers for this test
      expect(helpers[key].onChangeFns).not.toEqual(updaters[key].onChangeFns);
      expect(helpers[key].coreInnerFn).toBe(updaters[key].coreInnerFn);
      expect(helpers[key].innerFn).toBe(updaters[key].innerFn);
      expect(helpers[key].update).toBe(updaters[key].update);
    });
  });
});
