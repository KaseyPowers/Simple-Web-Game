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
import getLeaveRoomHelpers, { socketLeaveRoom } from "./leave_room_helpers";

const testRoomId = "test_game_room_id";
const testUserId = "test_user_id";
const testUserIds = [testUserId, "test_user_1", "test_user_2", "test_user_3"];

type ExpectedHelpers = Parameters<typeof getLeaveRoomHelpers>[1];

// set timeout to 10 seconds
jest.setTimeout(10 * 1000);

describe("leaveRoomHelpers", () => {
  const { getIO, getBothSockets } = testUseSocketIOServer();
  let io: ReturnType<typeof getIO>;
  let testRoom: GameRoomDataI;
  // will create 1 set of sockets for each userId defined
  let testMainSockets: Awaited<ReturnType<typeof getBothSockets>>;
  let testUserSockets: Awaited<ReturnType<typeof getBothSockets>>[];

  let mockedRemovePlayer: jest.Mocked<
    UpdaterFn<GameRoomDataI, [userId: string]>
  >;

  let mockedHelpers: ExpectedHelpers;

  beforeEach(async () => {
    Object.keys(allGameRooms).forEach((key) => {
      delete allGameRooms[key];
    });
    testRoom = newGameRoomData(testRoomId);
    allGameRooms[testRoomId] = testRoom;

    // mock the outer function
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

    io = getIO();
    // initiate the sockets needed
    testUserSockets = [];
    for (const userId of testUserIds) {
      const sockets = await getBothSockets(userId);
      // assign first sockets to main variable
      if (testUserSockets.length === 0) {
        testMainSockets = sockets;
      }
      testUserSockets.push(sockets);
    }
  });
  it("verify some setup assumptions", () => {
    expect(testMainSockets.serverSocket.data.userId).toBe(testUserId);
  });

  describe("leaveRoom", () => {
    it("should have user leave the room", async () => {
      // setup all users in the room
      allGameRooms[testRoomId] = {
        ...testRoom,
        players: testUserIds,
      };
      // have all the sockets join the room
      for (const sockets of testUserSockets) {
        await socketRoomUtils.joinGameRoom(sockets.serverSocket, testRoomId);
      }
      // get leaveRoom helper for first user
      const { leaveRoom } = getLeaveRoomHelpers(
        {
          io,
          socket: testMainSockets.serverSocket,
        },
        mockedHelpers,
      );

      // validate current state before leaving
      expect(
        testMainSockets.serverSocket.rooms.has(
          socketRoomUtils.getGameRoom(testRoomId),
        ),
      ).toBeTruthy();
      expect(allGameRooms[testRoomId].players).toContain(testUserId);

      await leaveRoom(testRoomId);
      // after leaving, gameRoom shouldn't have userId anymore
      // NOTE: This is just confirming the mockImplementation?
      expect(allGameRooms[testRoomId].players).not.toContain(testUserId);
      expect(
        testMainSockets.serverSocket.rooms.has(
          socketRoomUtils.getGameRoom(testRoomId),
        ),
      ).toBeFalsy();
    });

    it("should have all sockets for user leave the room", async () => {
      // setup all users in the room
      allGameRooms[testRoomId] = {
        ...testRoom,
        players: testUserIds,
      };

      const usersSockets = [testMainSockets];
      // create a few extra sockets for the user
      for (let i = 0; i < 3; i += 1) {
        const sockets = await getBothSockets(testUserId);
        usersSockets.push(sockets);
        testUserSockets.push(sockets);
      }

      // have all the sockets join the room
      for (const sockets of testUserSockets) {
        await socketRoomUtils.joinGameRoom(sockets.serverSocket, testRoomId);
      }
      // make sure all the sockets were joined correctly
      testUserSockets.forEach((sockets) => {
        expect(
          sockets.serverSocket.rooms.has(
            socketRoomUtils.getGameRoom(testRoomId),
          ),
        ).toBeTruthy();
        expect(sockets.serverSocket.data.roomId).toBe(testRoomId);
      });
      // these sockets break the expected battern so add them after the other setup validation test
      // add more sockets for user that either have data set or roomId set
      // we know these will work because we grab socket by userId
      const justDataSockets = await getBothSockets(testUserId);
      justDataSockets.serverSocket.data.roomId = testRoomId;
      usersSockets.push(justDataSockets);
      testUserSockets.push(justDataSockets);
      const justRoomSockets = await getBothSockets(testUserId);
      await justRoomSockets.serverSocket.join(
        socketRoomUtils.getGameRoom(testRoomId),
      );
      usersSockets.push(justRoomSockets);
      testUserSockets.push(justRoomSockets);

      // get leaveRoom helper for first user
      const { leaveRoom } = getLeaveRoomHelpers(
        {
          io,
          socket: testMainSockets.serverSocket,
        },
        mockedHelpers,
      );

      // validate current state before leaving
      expect(allGameRooms[testRoomId].players).toContain(testUserId);

      await leaveRoom(testRoomId);
      // after leaving, gameRoom shouldn't have userId anymore
      // NOTE: This is just confirming the mockImplementation?
      expect(allGameRooms[testRoomId].players).not.toContain(testUserId);
      usersSockets.forEach((sockets) => {
        expect(
          sockets.serverSocket.rooms.has(
            socketRoomUtils.getGameRoom(testRoomId),
          ),
        ).toBeFalsy();
      });

      const allSockets = await io.fetchSockets();
      for (const socket of allSockets) {
        // flags for if userId or in room
        const isTestUser = socket.data.userId === testUserId;
        const isInRoom = socket.data.roomId === testRoomId;
        // this check only works if all sockets are in this room
        expect(isInRoom).not.toBe(isTestUser);
        // make sure all of the main users are in the room for their userId
        expect(
          socket.rooms.has(socketRoomUtils.getUserIdRoom(testUserId)),
        ).toBe(isTestUser);
        // make sure they aren't in the gameRoom's room if their data doesn't reflect that
        expect(socket.rooms.has(socketRoomUtils.getGameRoom(testRoomId))).toBe(
          isInRoom,
        );
      }
    });

    it("if only player in room, will close room and remove all sockets", async () => {
      // setup just this user in the room
      allGameRooms[testRoomId] = {
        ...testRoom,
        players: [testUserId],
      };

      // have all the sockets join the room (even though they aren't all in the gameRoom)
      for (const sockets of testUserSockets) {
        await socketRoomUtils.joinGameRoom(sockets.serverSocket, testRoomId);
      }

      // make a new socket tied to a different room so that not all sockets are tied to this room
      const randomNewSockets = await getBothSockets("new_user_id");
      await socketRoomUtils.joinGameRoom(
        randomNewSockets.serverSocket,
        "other_room_id",
      );

      // get leaveRoom helper for first user
      const { leaveRoom } = getLeaveRoomHelpers(
        {
          io,
          socket: testMainSockets.serverSocket,
        },
        mockedHelpers,
      );

      // validate current state before leaving
      for (const sockets of testUserSockets) {
        expect(
          sockets.serverSocket.rooms.has(
            socketRoomUtils.getGameRoom(testRoomId),
          ),
        ).toBeTruthy();
      }

      expect(allGameRooms[testRoomId].players).toContain(testUserId);
      await leaveRoom(testRoomId);
      // after leaving, gameRoom shouldn't have userId anymore
      // NOTE: This is just confirming the mockImplementation?
      // removed room will be deleted so this is undefined
      expect(allGameRooms[testRoomId]).toBeUndefined();
      // all sockets tied to this room will be removed from the room

      const allSockets = await io.fetchSockets();
      for (const socket of allSockets) {
        // expect all sockets to not be a part of this room
        expect(socket.data.roomId).not.toBe(testRoomId);
        expect(
          socket.rooms.has(socketRoomUtils.getGameRoom(testRoomId)),
        ).toBeFalsy();
      }
    });
  });

  describe("thisSocketLeaveRoom", () => {
    it("should have socket leave the room", async () => {
      // setup all users in the room
      allGameRooms[testRoomId] = {
        ...testRoom,
        players: testUserIds,
      };

      const newUsersSockets = [];
      // create a few extra sockets for the user
      for (let i = 0; i < 3; i += 1) {
        const sockets = await getBothSockets(testUserId);
        newUsersSockets.push(sockets);
        testUserSockets.push(sockets);
      }
      // have all the sockets join the room
      for (const sockets of testUserSockets) {
        await socketRoomUtils.joinGameRoom(sockets.serverSocket, testRoomId);
      }
      // get thisSocketLeaveRoom helper for first user
      const { thisSocketLeaveRoom } = getLeaveRoomHelpers(
        {
          io,
          socket: testMainSockets.serverSocket,
        },
        mockedHelpers,
      );

      // validate current state before leaving
      expect(
        testMainSockets.serverSocket.rooms.has(
          socketRoomUtils.getGameRoom(testRoomId),
        ),
      ).toBeTruthy();
      expect(testMainSockets.serverSocket.data.roomId).toBe(testRoomId);
      expect(allGameRooms[testRoomId].players).toContain(testUserId);

      await thisSocketLeaveRoom();

      expect(testMainSockets.serverSocket.data.roomId).toBeUndefined();
      expect(
        testMainSockets.serverSocket.rooms.has(
          socketRoomUtils.getGameRoom(testRoomId),
        ),
      ).toBeFalsy();
      // because user has other sockets in the room, will not change the room
      expect(allGameRooms[testRoomId].players).toContain(testUserId);
      // all other sockets for user leave the room
      newUsersSockets.forEach((usersSockets) => {
        expect(usersSockets.serverSocket.data.userId).toBe(testUserId);
        expect(usersSockets.serverSocket.data.roomId).toBe(testRoomId);
        expect(
          usersSockets.serverSocket.rooms.has(
            socketRoomUtils.getGameRoom(testRoomId),
          ),
        ).toBeTruthy();
      });
    });

    it.todo("will call leaveRoom if user has no other sockets in room");

    it.todo(".ifRoom");
    it.todo(".ifNotRoom");
  });
});
