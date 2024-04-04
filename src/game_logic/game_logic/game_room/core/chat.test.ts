/**
 * @jest-environment node
 */
import { updaters, type ChatDataI, type ChatInputI } from "./chat";
import { newGameRoomData } from "./room";
import { makeUpdaterCall } from "./updater_test_utils";

import { utils as playerUtils } from "./players";

jest.mock("./players");

// // mock players utilities to avoid validation error?
// // eslint-disable-next-line @typescript-eslint/consistent-type-imports
// jest.mock<typeof import("./players")>("./players");

// jest.mock("./players");
// const {utils: playerUtils} =

const { addChatMessage } = updaters;

const testRoomId = "test_room_id";
const testPlayerId = "test_player_id";
const testRoom = newGameRoomData(testRoomId);

describe("core chat updaters", () => {
  let mockPlayerValidator;
  beforeEach(() => {
    mockPlayerValidator = jest.mocked(playerUtils.validatePlayerInRoom);
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

    const [newRoom, changed] = makeUpdaterCall(
      addChatMessage,
      testRoom,
      testChatInput,
    );
    expect(changed).toBeTruthy();
    expect(newRoom).toEqual({
      ...testRoom,
      chat: [testChatData],
    });
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
    // makeUpdaterCall uses expect's in it, so curious to see how it goes wrapping it to test for errors
    expect(() => {
      makeUpdaterCall(addChatMessage, testRoom, testChatInput);
    }).toThrow("Invalid message!");
  });

  it("should validate the messages userId", () => {
    // actually doesn't validate while mocking so first clear
  });
});
