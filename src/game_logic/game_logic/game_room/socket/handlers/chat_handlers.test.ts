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
import type { ChatInputI, ChatDataI } from "../../core/chat";
import { type GameRoomDataI, newGameRoomData } from "../../core/room";
import { utils, updaters, playerUpdaterKeys } from "../../core";
import { allGameRooms } from "~/game_logic/game_logic/shared_store";
import registerChatHandlers from "./chat_handlers";
import { setRoom } from "../../core/store_utils";

type ExpectedHelpers = Parameters<typeof registerChatHandlers>[1];

// set 10s timeout
jest.setTimeout(10 * 1000);

describe("chatHandler", () => {
  const { getIO, getBothSockets } = testUseSocketIOServer();

  const testRoomId = "test_game_room_id";
  let testRoom: GameRoomDataI;

  let mockedAddChat: jest.Mocked<
    UpdaterFn<GameRoomDataI, [inputMsg: ChatInputI]>
  >;
  let mockedOnPlayerAction: jest.Mocked<
    UpdaterFn<GameRoomDataI, [userId: string]>
  >;
  let mockedHelpers: ExpectedHelpers;

  const testUserId1 = "test_user_id_1";
  let sockets1: Awaited<ReturnType<typeof getBothSockets>>;
  const testUserId2 = "test_user_id_2";
  let sockets2: Awaited<ReturnType<typeof getBothSockets>>;
  const testUserId3 = "test_user_id_3";
  let sockets3: Awaited<ReturnType<typeof getBothSockets>>;

  beforeEach(async () => {
    // clear store before each
    Object.keys(allGameRooms).forEach((key) => {
      delete allGameRooms[key];
    });

    testRoom = newGameRoomData(testRoomId);
    // add testRoom to store
    utils.setRoom(testRoom);

    mockedAddChat = jest.fn(() => [testRoom, true]);
    mockedOnPlayerAction = jest.fn();

    mockedHelpers = {
      addChatMessage: mockedAddChat,
      onPlayerAction: mockedOnPlayerAction,
    } as ExpectedHelpers;

    const io = getIO();

    sockets1 = await getBothSockets(testUserId1);
    sockets2 = await getBothSockets(testUserId2);
    sockets3 = await getBothSockets(testUserId3);

    // add chatHandler to both sockets
    // NOTE: Shouldn't use same handlers for both sockets usually but should be fine for simple tests
    registerChatHandlers({ io, socket: sockets1.serverSocket }, mockedHelpers);
    registerChatHandlers({ io, socket: sockets2.serverSocket }, mockedHelpers);
  });

  it("should hanlde incoming message events", async () => {
    // setup for test
    const useTestRoom = {
      ...testRoom,
      players: [testUserId1],
    };
    setRoom(useTestRoom);
    await socketRoomUtils.joinGameRoom(sockets1.serverSocket, testRoomId);

    // verify setup
    // verify store room values
    expect(allGameRooms[testRoomId]?.players).toEqual([testUserId1]);
    expect(allGameRooms[testRoomId]?.chat).toEqual([]);
    // verify socket joined correctly
    expect(sockets1.serverSocket.data.roomId).toBe(testRoomId);
    expect(
      sockets1.serverSocket.rooms.has(socketRoomUtils.getGameRoom(testRoomId)),
    ).toBeTruthy();

    const testChatStr = "I am a chat message";
    const testChatData: ChatDataI = {
      userId: testUserId1,
      msg: testChatStr,
    };
    const testMessage: ChatInputI = {
      roomId: testRoomId,
      ...testChatData,
    };

    const response = await sockets1.clientSocket.emitWithAck(
      "message",
      testMessage,
    );
    // callback response only defined if error
    expect(response).toBeUndefined();
    // This would work if using actual helpers instead of mocked ones
    // expect(allGameRooms[testRoomId]?.chat).toEqual([testChatData]);
    expect(mockedAddChat).toHaveBeenCalledTimes(1);
    expect(mockedAddChat).toHaveBeenCalledWith(testRoomId, testMessage);
    expect(mockedOnPlayerAction).toHaveBeenCalledTimes(1);
    expect(mockedOnPlayerAction).toHaveBeenCalledWith(testRoom, testUserId1);
  });

  it("should emit message event to the room", async () => {
    // setup for test
    const useTestRoom = {
      ...testRoom,
      players: [testUserId1],
    };
    setRoom(useTestRoom);
    await socketRoomUtils.joinGameRoom(sockets1.serverSocket, testRoomId);
    await socketRoomUtils.joinGameRoom(sockets2.serverSocket, testRoomId);
    await socketRoomUtils.joinGameRoom(sockets3.serverSocket, testRoomId);

    // setup same as previous one plus one socket in room so feels fine to skip some of this validation

    const testChatStr = "I am a chat message";
    const testChatData: ChatDataI = {
      userId: testUserId1,
      msg: testChatStr,
    };
    const testMessage: ChatInputI = {
      roomId: testRoomId,
      ...testChatData,
    };

    return Promise.all([
      sockets1.clientSocket.emitWithAck("message", testMessage),
      waitFor<[ChatInputI]>(sockets2.clientSocket, "message"),
      waitFor<[ChatInputI]>(sockets3.clientSocket, "message"),
    ]).then(([sendResponse, ...chatEvents]) => {
      expect(sendResponse).toBeUndefined();
      expect(chatEvents).toEqual([testMessage, testMessage]);
    });
  });

  it("should throw error if message for a different room", async () => {
    // setup for test
    const useTestRoom = {
      ...testRoom,
      players: [testUserId1],
    };
    setRoom(useTestRoom);
    await socketRoomUtils.joinGameRoom(sockets1.serverSocket, testRoomId);

    // verify setup
    // verify store room values
    expect(allGameRooms[testRoomId]?.players).toEqual([testUserId1]);
    expect(allGameRooms[testRoomId]?.chat).toEqual([]);
    // verify socket joined correctly
    expect(sockets1.serverSocket.data.roomId).toBe(testRoomId);
    expect(
      sockets1.serverSocket.rooms.has(socketRoomUtils.getGameRoom(testRoomId)),
    ).toBeTruthy();

    const testChatStr = "I am a chat message";
    const testChatData: ChatDataI = {
      userId: testUserId1,
      msg: testChatStr,
    };
    const testMessage: ChatInputI = {
      roomId: testRoomId,
      ...testChatData,
    };
    // validate it works normally
    let response = await sockets1.clientSocket.emitWithAck(
      "message",
      testMessage,
    );
    // expect an error
    expect(response).toBeUndefined();
    const otherRoomId = "Some_Other_Room_Id";
    expect(otherRoomId).not.toBe(testRoomId);
    response = await sockets1.clientSocket.emitWithAck("message", {
      ...testMessage,
      roomId: otherRoomId,
    });
    // verify invalid message error message
    expect(response?.error.message).toMatch("Invalid message!");
    // verify it's because of the room by looking for the roomId in the error message
    expect(response?.error.message).toMatch("" + testRoomId);
    expect(response?.error.message).toMatch("" + otherRoomId);
  });

  it("should throw error if socket not in the room", async () => {
    // setup for test
    const useTestRoom = {
      ...testRoom,
      players: [testUserId1],
    };
    setRoom(useTestRoom);

    // verify setup
    // verify store room values
    expect(allGameRooms[testRoomId]?.players).toEqual([testUserId1]);
    expect(allGameRooms[testRoomId]?.chat).toEqual([]);
    // verify socket joined correctly
    expect(sockets1.serverSocket.data.roomId).not.toBe(testRoomId);

    const testChatStr = "I am a chat message";
    const testChatData: ChatDataI = {
      userId: testUserId1,
      msg: testChatStr,
    };
    const testMessage: ChatInputI = {
      roomId: testRoomId,
      ...testChatData,
    };
    // validate it works normally
    const response = await sockets1.clientSocket.emitWithAck(
      "message",
      testMessage,
    );
    // verify invalid message error message
    expect(response?.error.message).toMatch("Invalid message!");
    // verify it's because of the room by looking for the roomId in the error message
    expect(response?.error.message).toMatch("" + testRoomId);
  });

  it("should throw error if message is for user not tied to socket", async () => {
    // setup for test
    const useTestRoom = {
      ...testRoom,
      players: [testUserId1],
    };
    setRoom(useTestRoom);
    await socketRoomUtils.joinGameRoom(sockets1.serverSocket, testRoomId);

    // verify setup
    // verify store room values
    expect(allGameRooms[testRoomId]?.players).toEqual([testUserId1]);
    expect(allGameRooms[testRoomId]?.chat).toEqual([]);
    // verify socket joined correctly
    expect(sockets1.serverSocket.data.roomId).toBe(testRoomId);
    expect(
      sockets1.serverSocket.rooms.has(socketRoomUtils.getGameRoom(testRoomId)),
    ).toBeTruthy();

    const testChatStr = "I am a chat message";
    const testChatData: ChatDataI = {
      userId: testUserId1,
      msg: testChatStr,
    };
    const testMessage: ChatInputI = {
      roomId: testRoomId,
      ...testChatData,
    };
    // verify it works as expected
    let response = await sockets1.clientSocket.emitWithAck(
      "message",
      testMessage,
    );
    expect(response).toBeUndefined();
    // now trying an invalid
    response = await sockets1.clientSocket.emitWithAck("message", {
      ...testMessage,
      userId: testUserId2,
    });
    // verify invalid message error message
    expect(response?.error.message).toMatch("Invalid message!");
    // verify it's because of the userId by looking for the userId in the error message
    expect(response?.error.message).toMatch("" + testUserId1);
    expect(response?.error.message).toMatch("" + testUserId2);
  });
});
