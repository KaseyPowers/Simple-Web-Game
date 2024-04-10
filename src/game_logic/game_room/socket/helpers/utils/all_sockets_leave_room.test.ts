import type { ServerType } from "~/socket_io/socket_types";
import socketRoomUtils from "~/socket_io/room_utils";
import socketLeaveRoom from "./socket_leave_room";
import allSocketsLeaveRoom from "./all_sockets_leave_room";

jest.mock("./socket_leave_room");

// predefine mocked return array
const mockSocketsArray = ["hello", "world"];
jest.mock("~/socket_io/room_utils", () => ({
  inGameRoom: jest.fn(() => {
    return {
      fetchSockets: () => Promise.resolve(mockSocketsArray),
    };
  }),
}));

const mockIOInput = "I'm a server" as unknown as ServerType;

describe("userIdLeaveRoom", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("verify mock socket fetching", async () => {
    const allRoomSockets = await socketRoomUtils
      .inGameRoom(mockIOInput, "room_id")
      .fetchSockets();

    expect(allRoomSockets).toEqual(mockSocketsArray);
  });

  it("should call fetchUserSockets", async () => {
    const testRoom = "room_id";
    await allSocketsLeaveRoom(mockIOInput, testRoom);
    expect(socketRoomUtils.inGameRoom).toHaveBeenCalled();
    expect(socketRoomUtils.inGameRoom).toHaveBeenCalledWith(
      mockIOInput,
      testRoom,
    );
  });

  it("should call socketLeaveRoom for each socket in fetchUserSockets", async () => {
    const testRoom = "room_id";
    await allSocketsLeaveRoom(mockIOInput, testRoom);
    expect(socketLeaveRoom).toHaveBeenCalledTimes(mockSocketsArray.length);
    mockSocketsArray.forEach((mockSocket) => {
      expect(socketLeaveRoom).toHaveBeenCalledWith(mockSocket, testRoom);
    });
  });
});
