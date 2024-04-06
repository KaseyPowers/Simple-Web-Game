/**
 * @jest-environment node
 */
import { makeUpdaterCall } from "../../updater_test_utils";
import { type GameRoomDataI, newGameRoomData } from "./room";

import { updaters, type ChatDataI, type ChatInputI } from "./chat";
import { utils as playerUtils } from "./players";

jest.mock("./players");

const { addChatMessage } = updaters;

const testRoomId = "test_room_id";
const testPlayerId = "test_player_id";

// only one updater at this point
describe("chat updaters (addChatMessage)", () => {
  // mock players validator utility to avoid validation errors (rely on players test to confirm it's behavior)
  let mockPlayerValidator: jest.Mocked<typeof playerUtils.validatePlayerInRoom>;
  let testRoom: GameRoomDataI;
  beforeEach(() => {
    mockPlayerValidator = jest.mocked(playerUtils.validatePlayerInRoom);
    // create a new copy of the test room for each test
    testRoom = newGameRoomData(testRoomId);
  });

  it("should add a chat message to room", () => {
    const testChatData: ChatDataI = {
      userId: testPlayerId,
      msg: "I'm a test message",
    };
    const testChatInput: ChatInputI = {
      roomId: testRoomId,
      ...testChatData,
    };

    const response = makeUpdaterCall<GameRoomDataI>(
      addChatMessage,
      testRoom,
      testChatInput,
    );
    expect(response).toEqual([
      // expected change to room
      {
        ...testRoom,
        chat: [testChatData],
      },
      true,
    ]);
  });

  it("should work when chat array already has values", () => {
    const existingChatItem: ChatDataI = {
      userId: "some random id",
      msg: "I'm an existing id",
    };
    // copy room and add a chat message (tried modifying testRoom but readonly made it unhappy (which was sort of the point so can't complain))
    const testRoomWithChat: GameRoomDataI = {
      ...testRoom,
      chat: [existingChatItem],
    };
    const testChatData: ChatDataI = {
      userId: testPlayerId,
      msg: "I'm a test message",
    };
    const testChatInput: ChatInputI = {
      roomId: testRoomId,
      ...testChatData,
    };

    const response = makeUpdaterCall<GameRoomDataI>(
      addChatMessage,
      testRoomWithChat,
      testChatInput,
    );
    expect(response).toEqual([
      // expected change to room
      {
        ...testRoom,
        chat: [existingChatItem, testChatData],
      },
      true,
    ]);
  });

  it("should validate input's roomId", () => {
    const testChatData: ChatDataI = {
      userId: testPlayerId,
      msg: "I'm a test message",
    };
    const testChatInput: ChatInputI = {
      roomId: testRoomId + "_but_wrong",
      ...testChatData,
    };
    expect(testChatInput.roomId).not.toEqual(testRoomId);
    // makeUpdaterCall uses expect's in it, so curious to see how it goes wrapping it to test for errors
    expect(() => {
      makeUpdaterCall<GameRoomDataI>(addChatMessage, testRoom, testChatInput);
    }).toThrow("Invalid message!");
  });

  it("should call playerUtil's validator to validate messages userId", () => {
    expect(mockPlayerValidator).not.toHaveBeenCalled();
    const testChatInput: ChatInputI = {
      roomId: testRoomId,
      userId: testPlayerId,
      msg: "I'm a test message",
    };
    makeUpdaterCall<GameRoomDataI>(addChatMessage, testRoom, testChatInput);
    expect(mockPlayerValidator).toHaveBeenCalledTimes(1);
    expect(mockPlayerValidator).toHaveBeenCalledWith(testRoom, testPlayerId);
  });
});
