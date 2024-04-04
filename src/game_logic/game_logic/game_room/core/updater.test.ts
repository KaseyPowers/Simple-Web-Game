/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";
import { type GameRoomDataI, newGameRoomData } from "./room";
import type {
  UpdaterResponse,
  UpdaterDef,
  Updater,
  UpdaterFnInput,
} from "./updater_types";
import { createUpdater } from "./updater";
import { makeUpdaterCall } from "./updater_test_utils";

const testRoomId = "test_room_id";
const testRoom: GameRoomDataI = newGameRoomData(testRoomId);
const secondRoom: GameRoomDataI = newGameRoomData("second_room_id");

describe("GameRoom Core Updater", () => {
  let testDef: jest.Mock<UpdaterDef>;
  beforeEach(() => {
    testDef = jest.fn();
  });

  it("creates a function with `inner` property", () => {
    const updater = createUpdater(testDef);
    expect(updater).toBeDefined();
    expect(typeof updater).toBe("function");
    expect(updater.inner).toBeDefined();
    expect(typeof updater.inner).toBe("function");
  });

  it("updater fn accepts a room or UpdaterResponse", () => {
    const updater = createUpdater(testDef);
    // with default empty testDef, updater should always return [testRoom, false]
    expect(updater(testRoom)).toEqual([testRoom, false]);
    expect(updater([testRoom, false])).toEqual([testRoom, false]);
    expect(updater([testRoom, true])).toEqual([testRoom, true]);
  });

  describe("check makeUpdaterCall", () => {
    let updater: Updater;
    const testInputs: { input: UpdaterFnInput }[] = [
      { input: testRoom },
      { input: [testRoom, false] },
      { input: [testRoom, true] },
      { input: secondRoom },
      { input: [secondRoom, false] },
      { input: [secondRoom, true] },
    ];
    beforeEach(() => {
      updater = createUpdater(testDef);
    });

    it.each(testInputs)(
      "should wrap updater call without modifying",
      ({ input }) => {
        expect(makeUpdaterCall(updater, input)).toEqual(updater(input));
      },
    );
  });

  describe("updater inner", () => {
    let updater: Updater;
    beforeEach(() => {
      updater = createUpdater(testDef);
    });

    it("wraps inputFn replacing room argument with a Response tuple", () => {
      // make sure testDef hasn't been called somehow (either bad test setup or createUpdater called it)
      expect(testDef).not.toHaveBeenCalled();
      // simple test Input
      const testInnerInput: UpdaterResponse = [testRoom, false];
      const testArgs = ["a", 12];
      const innerResponse = updater.inner(testInnerInput, ...testArgs);
      expect(testDef).toHaveBeenCalledTimes(1);
      // should call the def with just a room and pass along rest of the arguments
      expect(testDef).toHaveBeenCalledWith(testRoom, ...testArgs);
      // empty mock should return void/undefined
      expect(testDef).toHaveReturnedWith(undefined);
      // when fn returns undefined/void, should return the input value
      expect(innerResponse).toEqual(testInnerInput);
    });

    it("merges onChange from input and inputFn", () => {
      // This test basically is confirming the fn treats onChange with boolean OR logic

      // default return undefined will return back the input
      expect(updater.inner([testRoom, false])).toEqual([testRoom, false]);
      expect(testDef).toHaveLastReturnedWith(undefined);

      /** Test B = false of OR Table */
      testDef.mockReturnValue([testRoom, false]);
      // no change + no change = no change
      expect(updater.inner([testRoom, false])).toEqual([testRoom, false]);
      expect(testDef).toHaveLastReturnedWith([testRoom, false]);
      // change + no change = change
      expect(updater.inner([testRoom, true])).toEqual([testRoom, true]);
      // but still returned false
      expect(testDef).toHaveLastReturnedWith([testRoom, false]);

      /** Testing B = true */
      testDef.mockReturnValue([testRoom, true]);
      // no change + change = change
      expect(updater.inner([testRoom, false])).toEqual([testRoom, true]);
      expect(testDef).toHaveLastReturnedWith([testRoom, true]);
      // change + change = change
      expect(updater.inner([testRoom, true])).toEqual([testRoom, true]);
      // but still returned false
      expect(testDef).toHaveLastReturnedWith([testRoom, true]);
    });

    it("Use inputFn response room (if there is one)", () => {
      testDef.mockReturnValue([secondRoom, true]);
      // confirm it behaves the same regardless of input onChange
      expect(updater.inner([testRoom, false])).toEqual([secondRoom, true]);
      expect(updater.inner([testRoom, true])).toEqual([secondRoom, true]);
    });

    it("throws error if reporting no changes but different room", () => {
      testDef
        .mockReturnValueOnce([secondRoom, true])
        .mockReturnValueOnce([secondRoom, false]);
      // works once with true
      expect(() => {
        updater.inner([testRoom, false]);
      }).not.toThrow();

      expect(() => {
        updater.inner([testRoom, false]);
      }).toThrow("no changes occured but returned a new room");
    });
  });
});
