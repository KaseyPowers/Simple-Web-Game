import socketRoomUtils from "~/socket_io/room_utils";
import { waitFor, testUseSocketIOServer } from "~/socket_io/test_utils";

import socketLeaveRoom from "./socket_leave_room";

const testRoomId = "test_game_room_id";
const testUserId = "test_user_id";
const testUserIds = [testUserId, "test_user_1", "test_user_2", "test_user_3"];

// set timeout to 10 seconds
jest.setTimeout(10 * 1000);
describe("socketLeaveRoom", () => {
  const { getBothSockets } = testUseSocketIOServer();
  // will create 1 set of sockets for each userId defined
  let testMainSockets: Awaited<ReturnType<typeof getBothSockets>>;
  let testUserSockets: Awaited<ReturnType<typeof getBothSockets>>[];

  beforeEach(async () => {
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
  it("should always emit leave_room event", async () => {
    // only join first room, but will test from every room
    await socketRoomUtils.joinGameRoom(
      testMainSockets.serverSocket,
      testRoomId,
    );

    return Promise.all(
      testUserSockets.map((sockets) => {
        socketLeaveRoom(sockets.serverSocket, testRoomId);
        return waitFor<string>(sockets.clientSocket, "leave_room");
      }),
    ).then((responses) => {
      expect(responses).toHaveLength(testUserSockets.length);
      expect(responses.every((val) => val === testRoomId)).toBeTruthy();
    });
  });

  it("will leave the room if socket in room", async () => {
    // only have the first half of rooms join
    const halfLength = Math.floor(testUserSockets.length / 2);
    for (let i = 0; i <= halfLength; i += 1) {
      const serverSocket = testUserSockets[i]?.serverSocket;
      if (serverSocket) {
        await socketRoomUtils.joinGameRoom(serverSocket, testRoomId);
      }
    }
    const extraSockets = await getBothSockets("some_user_id");
    const otherRoomId = "other_test_room_id";
    await socketRoomUtils.joinGameRoom(extraSockets.serverSocket, otherRoomId);

    // validate having joined
    testUserSockets.forEach((sockets, index) => {
      expect(sockets.serverSocket.data.roomId).toBe(
        index <= halfLength ? testRoomId : undefined,
      );
      expect(
        sockets.serverSocket.rooms.has(socketRoomUtils.getGameRoom(testRoomId)),
      ).toBe(index <= halfLength);
    });
    expect(extraSockets.serverSocket.data.roomId).toBe(otherRoomId);
    expect(
      extraSockets.serverSocket.rooms.has(
        socketRoomUtils.getGameRoom(otherRoomId),
      ),
    ).toBeTruthy();

    for (const sockets of testUserSockets) {
      socketLeaveRoom(sockets.serverSocket, testRoomId);
    }
    socketLeaveRoom(extraSockets.serverSocket, testRoomId);

    for (const sockets of testUserSockets) {
      // we know we didn't add any other roomIds so this is fine
      expect(sockets.serverSocket.data.roomId).toBeUndefined();
    }
    // verify the leaveRoom didn't modify this data since it didn't match the testRoomId
    expect(extraSockets.serverSocket.data.roomId).toBe(otherRoomId);
    expect(
      extraSockets.serverSocket.rooms.has(
        socketRoomUtils.getGameRoom(otherRoomId),
      ),
    ).toBeTruthy();
  });
});
