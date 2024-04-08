import type { ServerHandlerObj } from "~/socket_io/socket_util_types";
import socketRoomUtils from "~/socket_io/room_utils";
import {
  waitFor,
  getEventListener,
  testUseSocketIOServer,
  eventsPause,
} from "~/socket_io/test_utils";

import {
  type MockedUpdater,
  makeTestUpdater,
} from "../../../updater_test_utils";

import type { GameRoomPlayersI } from "../../core/players";
import type { PlayerUpdaterKeys } from "../../core/core_udpaters";
import { type GameRoomDataI, newGameRoomData } from "../../core/room";
import { utils, updaters, playerUpdaterKeys } from "../../core";
import type { CoreUpdaterHelpers } from "./core_updaters";
import getPlayerHelpers from "./player_helpers";

type AllUpdatersKeys = keyof typeof updaters;
const allUpdatersKeys = Object.keys(updaters) as AllUpdatersKeys[];

const nonPlayerKeys = (allUpdatersKeys as string[]).filter(
  (key) => !(playerUpdaterKeys as string[]).includes(key),
) as Exclude<AllUpdatersKeys, PlayerUpdaterKeys>[];

function buildTestHelpers(): Record<AllUpdatersKeys, MockedUpdater> {
  return allUpdatersKeys.reduce(
    (output, key) => {
      output[key] = makeTestUpdater();
      return output;
    },
    {} as Record<AllUpdatersKeys, MockedUpdater>,
  );
}

describe("getPlayerHelpers", () => {
  it("should add to the onChangeFns for player utils", () => {
    const testHelpers = buildTestHelpers();
    expect(Object.keys(testHelpers)).toBeArrayWith(allUpdatersKeys);
    expect(allUpdatersKeys).toBeArrayWith([
      ...nonPlayerKeys,
      ...playerUpdaterKeys,
    ]);

    allUpdatersKeys.forEach((key) => {
      expect(testHelpers[key]?.onChangeFns).toEqual([]);
    });
    // mock object to pass into function, just need to be able to destructure socket for now
    const ignoreSocketHelpers = {
      socket: "ignore",
    } as unknown as ServerHandlerObj;

    getPlayerHelpers(
      ignoreSocketHelpers,
      // need to cast the mocked helpers as normal ones for TS
      testHelpers as unknown as CoreUpdaterHelpers,
    );

    playerUpdaterKeys.forEach((key) => {
      expect(testHelpers[key].onChangeFns).toHaveLength(1);
    });
    nonPlayerKeys.forEach((key) => {
      expect(testHelpers[key].onChangeFns).toEqual([]);
    });
  });

  describe("players_update emitter", () => {
    const { getIO, getBothSockets } = testUseSocketIOServer();
    const testRoomId = "test_room_id";
    const expectedRoomData = {
      players: [],
      offlinePlayers: [],
    };
    let testRoom: GameRoomDataI;
    const userId1 = "test_user_1";
    let sockets1: Awaited<ReturnType<typeof getBothSockets>>;
    let helpers1: ReturnType<typeof buildTestHelpers>;
    const userId2 = "test_user_2";
    let sockets2: Awaited<ReturnType<typeof getBothSockets>>;
    let helpers2: ReturnType<typeof buildTestHelpers>;

    beforeEach(async () => {
      testRoom = newGameRoomData(testRoomId);
      const io = getIO();
      sockets1 = await getBothSockets(userId1);
      await socketRoomUtils.joinGameRoom(sockets1.serverSocket, testRoomId);
      helpers1 = buildTestHelpers();
      getPlayerHelpers(
        {
          io,
          socket: sockets1.serverSocket,
        },
        helpers1 as unknown as CoreUpdaterHelpers,
      );
      sockets2 = await getBothSockets(userId2);
      await socketRoomUtils.joinGameRoom(sockets2.serverSocket, testRoomId);
      helpers2 = buildTestHelpers();
      getPlayerHelpers(
        {
          io,
          socket: sockets2.serverSocket,
        },
        helpers2 as unknown as CoreUpdaterHelpers,
      );
    });
    it("verify setup assumptions", () => {
      expect(utils.getPlayersFromData(testRoom)).toEqual(expectedRoomData);
    });

    it("should emit on a playerUpdater change", async () => {
      // listener for socket1 which will emit
      const socket1Listener = getEventListener(
        sockets1.clientSocket,
        "players_update",
      );
      // set mock for this function to always return this room with changed true
      helpers1.addPlayer.coreInnerFn.mockImplementation(() => [testRoom, true]);
      // make a call to the inner function
      const mockInput = ["mock input", "two args"] as unknown as Parameters<
        typeof helpers1.addPlayer.innerFn
      >;
      helpers1.addPlayer.innerFn(...mockInput);
      expect(helpers1.addPlayer.coreInnerFn).toHaveBeenCalledTimes(1);
      expect(helpers1.addPlayer.coreInnerFn).toHaveBeenCalledWith(...mockInput);
      expect(helpers1.addPlayer.coreInnerFn).toHaveReturnedWith([
        testRoom,
        true,
      ]);

      const updateData = await waitFor<[string, GameRoomPlayersI]>(
        sockets2.clientSocket,
        "players_update",
      );

      expect(updateData).toEqual([testRoomId, expectedRoomData]);
      // verify that it only sent to other sockets not the current one
      expect(socket1Listener).not.toHaveBeenCalled();
    });

    it("should emit on only player events", async () => {
      // get listeners for both sockets
      const socket1Listener = getEventListener(
        sockets1.clientSocket,
        "players_update",
      );
      const socket2Listener = getEventListener(
        sockets2.clientSocket,
        "players_update",
      );
      // set it so that every helper returns a change
      allUpdatersKeys.forEach((key) => {
        helpers1[key].coreInnerFn.mockImplementation(() => [
          { ...testRoom, players: [key] },
          true,
        ]);
      });

      // first iterate through nonPlayerKeys (without awaits, so all async come after)
      for (const key of nonPlayerKeys) {
        const mockInput = ["mock input", "two args"] as unknown as Parameters<
          (typeof helpers1)[typeof key]["innerFn"]
        >;
        helpers1[key].innerFn(...mockInput);
        // validate the mock response from coreInnerFn
        expect(helpers1[key].coreInnerFn).toHaveBeenCalledTimes(1);
        expect(helpers1[key].coreInnerFn).toHaveBeenCalledWith(...mockInput);
        expect(helpers1[key].coreInnerFn).toHaveReturnedWith([
          { ...testRoom, players: [key] },
          true,
        ]);
      }
      // then iterate through the player updaters
      for (const key of playerUpdaterKeys) {
        const mockInput = ["mock input", "two args"] as unknown as Parameters<
          (typeof helpers1)[typeof key]["innerFn"]
        >;
        helpers1[key].innerFn(...mockInput);
        // validate the mock response from coreInnerFn

        expect(helpers1[key].coreInnerFn).toHaveBeenCalledTimes(1);
        expect(helpers1[key].coreInnerFn).toHaveBeenCalledWith(...mockInput);
        expect(helpers1[key].coreInnerFn).toHaveReturnedWith([
          { ...testRoom, players: [key] },
          true,
        ]);
        const response = await waitFor<[string, GameRoomPlayersI]>(
          sockets2.clientSocket,
          "players_update",
        );
        expect(response).toEqual([
          testRoomId,
          { ...expectedRoomData, players: [key] },
        ]);
      }
      await eventsPause();
      // verify that it only sent to other sockets not the current one
      expect(socket1Listener).not.toHaveBeenCalled();
      // verify that the second socket got called for each player handler
      expect(socket2Listener).toHaveBeenCalledTimes(playerUpdaterKeys.length);
    });
  });
});
