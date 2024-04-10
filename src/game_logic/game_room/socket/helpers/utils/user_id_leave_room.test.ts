import type { RemoteSocketType, ServerType } from "~/socket_io/socket_types";
import { fetchUserSockets } from "~/socket_io/socket_utils";

import socketLeaveRoom from "./socket_leave_room";
import userIdLeaveRoom from "./user_id_leave_room";

jest.mock("./socket_leave_room");
jest.mock("~/socket_io/socket_utils");

// predefine mocked return array
const mockIOInput = "I'm a server" as unknown as ServerType;
const mockReturnArray = ["hello", "world"] as unknown as Awaited<
  ReturnType<typeof fetchUserSockets>
>;

const mockedFetchUserSockets = jest
  .mocked(fetchUserSockets)
  .mockImplementation(() => {
    return Promise.resolve(mockReturnArray);
  });

describe("userIdLeaveRoom", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("verify mock fetchUserSockets", async () => {
    expect(jest.isMockFunction(fetchUserSockets)).toBeTruthy();
    const userSockets = await fetchUserSockets(mockIOInput, "user id");
    expect(userSockets).toEqual(mockReturnArray);
    expect(mockedFetchUserSockets).toHaveBeenCalled();
  });

  it("should call fetchUserSockets", async () => {
    const testUser = "user_id";
    const testRoom = "room_id";
    await userIdLeaveRoom(mockIOInput, testUser, testRoom);
    expect(mockedFetchUserSockets).toHaveBeenCalled();
    expect(mockedFetchUserSockets).toHaveBeenCalledWith(mockIOInput, testUser);
  });

  it("should call socketLeaveRoom for each socket in fetchUserSockets", async () => {
    const testUser = "user_id";
    const testRoom = "room_id";
    await userIdLeaveRoom(mockIOInput, testUser, testRoom);
    expect(socketLeaveRoom).toHaveBeenCalledTimes(mockReturnArray.length);
    mockReturnArray.forEach((mockSocket) => {
      expect(socketLeaveRoom).toHaveBeenCalledWith(mockSocket, testRoom);
    });
  });
});
