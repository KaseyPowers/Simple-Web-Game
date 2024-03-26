/**
 * @jest-environment node
 */

import { waitFor, testUseSocketIOServer } from "./test_utils";

describe.only("socket test utils/base socket logic", () => {
  const { getIO, getClientSocket, getServerSocket, getBothSockets } =
    testUseSocketIOServer();

  test("io should be defined", () => {
    const io = getIO();
    expect(io).toBeDefined();
  });

  test("getClientSocket will return a socket (but not connected)", () => {
    const socketA = getClientSocket();
    expect(socketA).toBeDefined();
    expect(socketA.connected).toBeFalsy();

    const socketB = getClientSocket("with_user_id");
    expect(socketB).toBeDefined();
    expect(socketB.auth).toEqual({ userId: "with_user_id" });
    expect(socketB.connected).toBeFalsy();
  });
  test("getClientSocket will create a serverSocket promise if userId defined", () => {
    const userId = "with_user_id";
    const clientSocket = getClientSocket(userId);
    expect(clientSocket.auth).toEqual({ userId: userId });
    expect(getServerSocket(userId)).toBeDefined();
  });

  describe("socket connections work", () => {
    test("can connect to server", (done) => {
      const userId = "test_user";
      const clientSocket = getClientSocket(userId);
      clientSocket.on("connect", () => {
        expect(clientSocket.id).toBeDefined();
        expect(clientSocket.connected).toBeTruthy();
        done();
      });
      clientSocket.connect();
    });

    test("can't connect to server without userId", (done) => {
      const clientSocket = getClientSocket();
      clientSocket.on("connect_error", (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Missing UserId");
        done();
      });
      clientSocket.connect();
    });

    test("can get the server socket", async () => {
      const userId = "test_user";
      const clientSocket = getClientSocket(userId);
      const serverSocketPromise = getServerSocket(userId);
      // expect there to be a promise available
      expect(serverSocketPromise).toBeDefined();
      // start the connection
      clientSocket.connect();
      // wait for promise to resolve
      const serverSocket = await serverSocketPromise;
      expect(serverSocket).toBeDefined();
      // don't love this pattern for mixed async/callback test, will keep an eye out for something better
      return new Promise<void>((resolve) => {
        clientSocket.on("connect", () => {
          expect(clientSocket.connected).toBeTruthy();
          resolve();
        });
      });
    });

    test("getBothSockets util works", async () => {
      const userId = "test_user";
      const { serverSocket, clientSocket } = await getBothSockets(userId);
      // getBothSockets provides basic verification testing of both sockets, so here we just double check they are returned correctly.
      expect(serverSocket).toBeDefined();
      expect(clientSocket).toBeDefined();
    });

    test("should be able to get multiple sperate socket sets for the same userId (simulating multiple tabs)", async () => {
      const userId = "test_user";
      // these tests will have some redundant checks for what is done by `getBothSockets` but will make this test easier to read on it's own and add a catch in case we change the util's behavior
      const firstSockets = await getBothSockets(userId);
      // verify the sockets match up. according to socketIO docks, they should have the same id
      expect(firstSockets.clientSocket.id).toBe(firstSockets.serverSocket.id);

      const secondSockets = await getBothSockets(userId);
      // verify second set of sockets match up too
      expect(secondSockets.clientSocket.id).toBe(secondSockets.serverSocket.id);
      // make sure the first and second set of sockets are unique
      expect(firstSockets.clientSocket.id).not.toBe(
        secondSockets.clientSocket.id,
      );
    });
  });
});
