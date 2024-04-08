/**
 * @jest-environment node
 */
import type {
  Server as SocketIOServer,
  Socket as ServerSocket,
} from "socket.io";
import type { Socket as ClientSocket } from "socket.io-client";

import {
  waitFor,
  getEventListener,
  testUseSocketIOServer,
  eventsPause,
} from "./test_utils";

// NOTE: try 15 second timeout
jest.setTimeout(15 * 1000);

describe("socket test utils/base socket logic", () => {
  const { getIO, getClientSocket, getServerSocket, getBothSockets } =
    testUseSocketIOServer(false);

  it("io should be defined", () => {
    const io = getIO();
    expect(io).toBeDefined();
  });

  it("getClientSocket will return a socket (but not connected)", () => {
    const socketA = getClientSocket();
    expect(socketA).toBeDefined();
    expect(socketA.connected).toBeFalsy();

    const socketB = getClientSocket("with_user_id");
    expect(socketB).toBeDefined();
    expect(socketB.auth).toEqual({ userId: "with_user_id" });
    expect(socketB.connected).toBeFalsy();
  });
  it("getClientSocket will create a serverSocket promise if userId defined", () => {
    const userId = "with_user_id";
    const clientSocket = getClientSocket(userId);
    expect(clientSocket.auth).toEqual({ userId: userId });
    expect(getServerSocket(userId)).toBeDefined();
  });

  describe("socket connections work", () => {
    it("can connect to server", () => {
      return new Promise<void>((resolve) => {
        const userId = "test_user";
        const clientSocket = getClientSocket(userId);
        clientSocket.on("connect", () => {
          expect(clientSocket.id).toBeDefined();
          expect(clientSocket.connected).toBeTruthy();
          resolve();
        });
        clientSocket.connect();
      });
    });

    it("can't connect to server without userId", () => {
      return new Promise<void>((resolve) => {
        const clientSocket = getClientSocket();
        clientSocket.on("connect_error", (err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe("Missing UserId");
          resolve();
        });
        clientSocket.connect();
      });
    });

    it("can get the server socket", async () => {
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

    it("getBothSockets util works", async () => {
      const userId = "test_user";
      const { serverSocket, clientSocket } = await getBothSockets(userId);
      // getBothSockets provides basic verification testing of both sockets, so here we just double check they are returned correctly.
      expect(serverSocket).toBeDefined();
      expect(clientSocket).toBeDefined();
    });

    it("should be able to get multiple sperate socket sets for the same userId (simulating multiple tabs)", async () => {
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

  describe("waitFor", () => {
    it("should work for client event", async () => {
      const userId = "test_user";
      // these tests will have some redundant checks for what is done by `getBothSockets` but will make this test easier to read on it's own and add a catch in case we change the util's behavior
      const sockets = await getBothSockets(userId);
      const clientSocket = sockets.clientSocket as ClientSocket;
      const serverSocket = sockets.serverSocket as ServerSocket;
      clientSocket.emit("hello", "world");
      const response = await waitFor(serverSocket, "hello");
      expect(response).toBe("world");

      serverSocket.emit("hello", "world");
      const response2 = await waitFor(clientSocket, "hello");
      expect(response2).toBe("world");
    });

    it("should work for multiple argument events", async () => {
      const userId = "test_user";
      // these tests will have some redundant checks for what is done by `getBothSockets` but will make this test easier to read on it's own and add a catch in case we change the util's behavior
      const sockets = await getBothSockets(userId);
      const clientSocket = sockets.clientSocket as ClientSocket;
      const serverSocket = sockets.serverSocket as ServerSocket;
      clientSocket.emit("hello", "world", "two");
      const response = await waitFor(serverSocket, "hello");
      expect(response).toEqual(["world", "two"]);

      serverSocket.emit("hello", "world", "two");
      const response2 = await waitFor(clientSocket, "hello");
      expect(response2).toEqual(["world", "two"]);
    });
  });

  describe("getEventListener", () => {
    it("should create mockfn thats called each time even is fired", async () => {
      const io: SocketIOServer = getIO();
      const sockets1: {
        clientSocket: ClientSocket;
        serverSocket: ServerSocket;
      } = await getBothSockets("user_1");
      const sockets2: {
        clientSocket: ClientSocket;
        serverSocket: ServerSocket;
      } = await getBothSockets("user_2");
      const testEvent = "Event!";
      const testEventArg = "hello world";
      const socket1Listener = getEventListener<string>(
        sockets1.clientSocket,
        testEvent,
      );
      // emit to all clients
      io.emit(testEvent, testEventArg);
      // use waitfor to know it's been received by other socket
      const waitResponse = await waitFor(sockets2.clientSocket, testEvent);
      // pause for listener to get events
      await eventsPause();
      expect(waitResponse).toEqual(testEventArg);
      expect(socket1Listener).toHaveBeenCalled();
      expect(socket1Listener).toHaveBeenCalledWith(testEventArg);
    });

    it("should catch events even if overlapping waitFor", async () => {
      const sockets: {
        clientSocket: ClientSocket;
        serverSocket: ServerSocket;
      } = await getBothSockets("user_1");
      const testEvent = "Event!";
      const testEventArg = "hello world";
      const socketListener = getEventListener<string>(
        sockets.clientSocket,
        testEvent,
      );
      // emit to all clients
      sockets.serverSocket.emit(testEvent, testEventArg);
      // use waitfor to know it's been received by other socket
      const waitResponse = await waitFor(sockets.clientSocket, testEvent);
      // shouldn't need pause since waitFor did waiting
      // await eventsPause();
      expect(waitResponse).toEqual(testEventArg);
      expect(socketListener).toHaveBeenCalledTimes(1);
      expect(socketListener).toHaveBeenCalledWith(testEventArg);
    });

    it("should be usable to verify call didn't happen", async () => {
      const sockets1: {
        clientSocket: ClientSocket;
        serverSocket: ServerSocket;
      } = await getBothSockets("user_1");
      const sockets2: {
        clientSocket: ClientSocket;
        serverSocket: ServerSocket;
      } = await getBothSockets("user_2");
      const testEvent = "Event!";
      const socket1Listener = getEventListener<string>(
        sockets1.clientSocket,
        testEvent,
      );
      const socket2Listener = getEventListener<string>(
        sockets2.clientSocket,
        testEvent,
      );
      // emit to all other clients from sockets1

      const testEventArg = "hello world";
      sockets1.serverSocket.broadcast.emit(testEvent, testEventArg);
      // use waitfor to know it's been received by other socket
      let waitResponse = await waitFor(sockets2.clientSocket, testEvent);
      expect(waitResponse).toEqual(testEventArg);

      // do the same thing again just for good measure
      const otherTestEventArg = "socket's sure are fun!";
      sockets1.serverSocket.broadcast.emit(testEvent, otherTestEventArg);
      // use waitfor to know it's been received by other socket
      waitResponse = await waitFor(sockets2.clientSocket, testEvent);
      expect(waitResponse).toEqual(otherTestEventArg);
      // pause for listener to get events
      await eventsPause();
      expect(socket1Listener).not.toHaveBeenCalled();
      expect(socket2Listener).toHaveBeenCalledTimes(2);
    });
  });
});
