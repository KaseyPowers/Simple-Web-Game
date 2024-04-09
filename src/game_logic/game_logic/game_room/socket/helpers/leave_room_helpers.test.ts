import type { ServerType, ServerSocketType } from "~/socket_io/socket_types";
import type { ServerHandlerObj } from "~/socket_io/socket_util_types";
import socketRoomUtils from "~/socket_io/room_utils";
import {
  waitFor,
  getEventListener,
  testUseSocketIOServer,
  eventsPause,
} from "~/socket_io/test_utils";

import type { UpdaterInner, UpdaterFn } from "../../../updater_types";
import {
  type MockedUpdater,
  makeTestUpdater,
} from "../../../updater_test_utils";

import type { GameRoomPlayersI } from "../../core/players";
import type { PlayerUpdaterKeys } from "../../core/core_udpaters";
import { type GameRoomDataI, newGameRoomData } from "../../core/room";
import { utils, updaters, playerUpdaterKeys } from "../../core";

import { allGameRooms } from "../../../shared_store";
import { UpdaterResponse } from "~/game_logic/game_logic/updater_types";
import type { CoreUpdaterHelpers } from "./core_updaters";

import socketLeaveRoom from "./utils/socket_leave_room";
import userIdLeaveRoom from "./utils/user_id_leave_room";
import allSocketsLeaveRoom from "./utils/all_sockets_leave_room";
import { hasSocketsInRoom } from "~/socket_io/socket_utils";

import getLeaveRoomHelpers, {
  LeaveRoomHelperTypes,
} from "./leave_room_helpers";

// mock socket logics
jest.mock("~/socket_io/socket_utils");
jest.mock("./utils/socket_leave_room");
jest.mock("./utils/user_id_leave_room");
jest.mock("./utils/all_sockets_leave_room");

const testRoomId = "test_game_room_id";
const testUserId = "test_user_id";

type ExpectedHelpers = Parameters<typeof getLeaveRoomHelpers>[1];

// set timeout to 10 seconds
// jest.setTimeout(10 * 1000);

function makeFakeSocket(userId: string) {
  return {
    data: {
      userId,
    },
  } as ServerSocketType;
}

const mockIO = "I'm a server" as unknown as ServerType;

describe("leaveRoomHelpers", () => {
  let testRoom: GameRoomDataI;
  // will create 1 set of sockets for each userId defined
  let testMainSocket: ServerSocketType;

  let mockedRemovePlayer: jest.Mocked<
    UpdaterFn<GameRoomDataI, [userId: string]>
  >;
  let mockedHelpers: ExpectedHelpers;

  beforeEach(() => {
    // clear mocks before each test
    jest.clearAllMocks();
    // clear store and add testRoom
    Object.keys(allGameRooms).forEach((key) => {
      delete allGameRooms[key];
    });
    testRoom = newGameRoomData(testRoomId);

    // mock the helper logic
    mockedRemovePlayer = jest.fn(
      (input, userId): UpdaterResponse<GameRoomDataI> => {
        const [room] = Array.isArray(input) ? input : [input];
        const currentPlayers = room.players;
        const newPlayers = currentPlayers.filter((id) => id !== userId);
        if (newPlayers.length === currentPlayers.length) {
          return [room, false];
        }
        const newRoom = { ...room, players: newPlayers };
        allGameRooms[room.roomId] = newRoom;
        return [newRoom, true];
      },
    );
    mockedHelpers = {
      removePlayer: mockedRemovePlayer,
    } as ExpectedHelpers;
    // initiate the sockets needed
    testMainSocket = makeFakeSocket(testUserId);
  });

  describe("leaveRoom", () => {
    it("should have user leave the room", async () => {
      // setup all users in the room
      // with this we can expect utils that fetch from store to find the room data
      const useTestRoom = {
        ...testRoom,
        players: [testUserId, "other_user"],
      };
      allGameRooms[testRoomId] = useTestRoom;
      // get leaveRoom helper for first user
      const { leaveRoom } = getLeaveRoomHelpers(
        {
          io: mockIO,
          socket: testMainSocket,
        },
        mockedHelpers,
      );

      expect(allGameRooms[testRoomId].players).toContain(testUserId);
      expect(allGameRooms[testRoomId].players.length).toBeGreaterThanOrEqual(2);
      expect(testMainSocket.data.userId).toBe(testUserId);
      await leaveRoom(testRoomId);
      // after leaving, gameRoom shouldn't have userId anymore
      // NOTE: This is just confirming the mockImplementation?
      expect(allGameRooms[testRoomId].players).not.toContain(testUserId);
      expect(allGameRooms[testRoomId].players).not.toHaveLength(0);
      expect(mockedRemovePlayer).toHaveBeenCalled();
      expect(mockedRemovePlayer).toHaveBeenCalledWith(useTestRoom, testUserId);
      expect(userIdLeaveRoom).toHaveBeenCalled();
      expect(userIdLeaveRoom).toHaveBeenCalledWith(
        mockIO,
        testUserId,
        testRoomId,
      );
      expect(allSocketsLeaveRoom).not.toHaveBeenCalled();
    });
    it("should call userIdLeaveRoom even if not in store", async () => {
      // get leaveRoom helper for first user
      const { leaveRoom } = getLeaveRoomHelpers(
        {
          io: mockIO,
          socket: testMainSocket,
        },
        mockedHelpers,
      );
      expect(allGameRooms[testRoomId]).toBeUndefined();
      expect(testMainSocket.data.userId).toBe(testUserId);
      await leaveRoom(testRoomId);
      // verify the socket util calls
      expect(userIdLeaveRoom).toHaveBeenCalled();
      expect(userIdLeaveRoom).toHaveBeenCalledWith(
        mockIO,
        testUserId,
        testRoomId,
      );
      expect(allSocketsLeaveRoom).not.toHaveBeenCalled();
    });

    it("should call allSocketsLeaveRoom if room becomes empty", async () => {
      // setup all users in the room
      // with this we can expect utils that fetch from store to find the room data
      const useTestRoom = {
        ...testRoom,
        players: [testUserId],
      };
      allGameRooms[testRoomId] = useTestRoom;
      // get leaveRoom helper for first user
      const { leaveRoom } = getLeaveRoomHelpers(
        {
          io: mockIO,
          socket: testMainSocket,
        },
        mockedHelpers,
      );

      expect(allGameRooms[testRoomId].players).toEqual([testUserId]);
      expect(testMainSocket.data.userId).toBe(testUserId);
      await leaveRoom(testRoomId);
      // after leaving, gameRoom shouldn't have userId anymore, since that was only player, should remove from the store
      // NOTE: This is just confirming the mockImplementation?
      expect(allGameRooms[testRoomId]).toBeUndefined();
      expect(mockedRemovePlayer).toHaveBeenCalled();
      expect(mockedRemovePlayer).toHaveBeenCalledWith(useTestRoom, testUserId);
      expect(allSocketsLeaveRoom).toHaveBeenCalled();
      expect(allSocketsLeaveRoom).toHaveBeenCalledWith(mockIO, testRoomId);
      expect(userIdLeaveRoom).not.toHaveBeenCalled();
    });
  });

  describe("thisSocketLeaveRoom", () => {
    let thisSocketLeaveRoom: LeaveRoomHelperTypes["thisSocketLeaveRoom"];
    let mockedHasSocketsInRoom: jest.MockedFunction<typeof hasSocketsInRoom>;
    beforeEach(() => {
      // give this a default truthy return value so leaveRoom isn't called until we want it to
      mockedHasSocketsInRoom = jest
        .mocked(hasSocketsInRoom)
        .mockReturnValue(Promise.resolve(true));
      testMainSocket.data.roomId = testRoomId;
      // get heleprs for the user
      // can't spyOn leaveRoom because thisSocketLeaveRoom calls reference from before function defined I think
      const leaveRoomHelpers = getLeaveRoomHelpers(
        {
          io: mockIO,
          socket: testMainSocket,
        },
        mockedHelpers,
      );
      thisSocketLeaveRoom = leaveRoomHelpers.thisSocketLeaveRoom;
      // // eslint-disable-next-line @typescript-eslint/no-empty-function
      // spiedLeaveRoom = jest
      //   .spyOn(leaveRoomHelpers, "leaveRoom")
      //   .mockImplementation(() => Promise.resolve());
    });
    it("should call socketLeaveRoom", async () => {
      expect(testMainSocket.data.roomId).toBe(testRoomId);

      await thisSocketLeaveRoom();

      expect(socketLeaveRoom).toHaveBeenCalled();
      expect(socketLeaveRoom).toHaveBeenCalledWith(testMainSocket, testRoomId);

      expect(mockedHasSocketsInRoom).toHaveBeenCalledTimes(1);
      // not sure this would work?
      await expect(mockedHasSocketsInRoom.mock.results[0]?.value).resolves.toBe(
        true,
      );
      // since we didn't modify the state store, leaveRoom will always call userIdLeaveRoom. use this to verify if leaveRoom was called
      expect(userIdLeaveRoom).not.toHaveBeenCalled();
    });
    it("should call leaveRoom if user has no other sockets in room", async () => {
      expect(testMainSocket.data.roomId).toBe(testRoomId);
      // resolve to false so that next step is hit
      mockedHasSocketsInRoom.mockReturnValueOnce(Promise.resolve(false));

      await thisSocketLeaveRoom();

      expect(socketLeaveRoom).toHaveBeenCalled();
      expect(socketLeaveRoom).toHaveBeenCalledWith(testMainSocket, testRoomId);

      expect(mockedHasSocketsInRoom).toHaveBeenCalledTimes(1);
      // not sure this would work?
      await expect(mockedHasSocketsInRoom.mock.results[0]?.value).resolves.toBe(
        false,
      );
      expect(userIdLeaveRoom).toHaveBeenCalled();
      expect(userIdLeaveRoom).toHaveBeenCalledWith(
        mockIO,
        testUserId,
        testRoomId,
      );
    });

    it("thisSocketLeaveRoom.ifRoom will only leaveRoom if socket is in the given room", async () => {
      expect(testMainSocket.data.roomId).toBe(testRoomId);

      const otherRoomId = "Other_test_room";
      expect(otherRoomId).not.toEqual(testRoomId);

      await thisSocketLeaveRoom.ifRoom(otherRoomId);

      expect(socketLeaveRoom).not.toHaveBeenCalled();

      await thisSocketLeaveRoom.ifRoom(testRoomId);
      // these values should only have been run once even though thisSocetLeaveRoom.ifRoom was called twice
      expect(socketLeaveRoom).toHaveBeenCalledTimes(1);
      expect(socketLeaveRoom).toHaveBeenCalledWith(testMainSocket, testRoomId);

      expect(mockedHasSocketsInRoom).toHaveBeenCalledTimes(1);
      // not sure this would work?
      await expect(mockedHasSocketsInRoom.mock.results[0]?.value).resolves.toBe(
        true,
      );
      // since we didn't modify the state store, leaveRoom will always call userIdLeaveRoom. use this to verify if leaveRoom was called
      expect(userIdLeaveRoom).not.toHaveBeenCalled();
    });

    it("thisSocketLeaveRoom.ifNotRoom will only leaveRoom if socket is not in the given room", async () => {
      expect(testMainSocket.data.roomId).toBe(testRoomId);

      const otherRoomId = "Other_test_room";
      expect(otherRoomId).not.toEqual(testRoomId);

      await thisSocketLeaveRoom.ifNotRoom(testRoomId);

      expect(socketLeaveRoom).not.toHaveBeenCalled();

      await thisSocketLeaveRoom.ifNotRoom(otherRoomId);

      // these values should only have been run once even though thisSocetLeaveRoom.ifRoom was called twice
      expect(socketLeaveRoom).toHaveBeenCalledTimes(1);
      expect(socketLeaveRoom).toHaveBeenCalledWith(testMainSocket, testRoomId);

      expect(mockedHasSocketsInRoom).toHaveBeenCalledTimes(1);
      // not sure this would work?
      await expect(mockedHasSocketsInRoom.mock.results[0]?.value).resolves.toBe(
        true,
      );
      // since we didn't modify the state store, leaveRoom will always call userIdLeaveRoom. use this to verify if leaveRoom was called
      expect(userIdLeaveRoom).not.toHaveBeenCalled();
    });

    it.todo(".ifRoom");
    it.todo(".ifNotRoom");
  });
});
