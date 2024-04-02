import { createServer, type Server } from "node:http";
import { type AddressInfo } from "node:net";

import { type Socket as BaseServerSocket } from "socket.io";
import { io as ioc, type Socket as BaseClientSocket } from "socket.io-client";

import type {
  ServerSocketType,
  ServerType,
  ClientSocketType,
} from "./socket_types";
import { baseClientOptions } from "./socket_configs";
import buildServerSocket, { getSocketServer } from "./server";

export function waitFor<T>(
  socket: BaseServerSocket | BaseClientSocket,
  event: string,
) {
  return new Promise<T>((resolve) => {
    socket.once(event, (...args) => {
      // there has to be a better way to do this than casting as T, but started to get real complicated, can revist later
      const output = (args.length <= 1 ? args[0] : args) as T;
      resolve(output);
    });
  });
}

export function getEventListener(
  socket: BaseServerSocket | BaseClientSocket,
  event: string,
) {
  const listener = jest.fn();
  socket.on(event, listener);
  return listener;
}

type ServerSocketResolver = (
  value: ServerSocketType | PromiseLike<ServerSocketType>,
) => void;

// type getClientSocketFn = () => ClientSocket;
// test setup for initializing the io server
export function testUseSocketIOServer(skipHandlers?: boolean) {
  // before all, set up an httpServer
  let httpServer: Server;
  // listen for the port to generate this path, that way multiple clients can be generated
  let clientPath: string;

  let io: ServerType;

  let serverSockets: Map<string, Promise<ServerSocketType>>;
  let serverSocketResolves: Record<string, ServerSocketResolver>;

  let clientSockets: ClientSocketType[];

  function getClientSocket(userId?: string): ClientSocketType {
    if (!clientPath) {
      throw new Error(
        "ClientPath should always be defined as long as this is called within the right context",
      );
    }
    const clientSocket = ioc(clientPath, {
      ...baseClientOptions,
      forceNew: true,
      transports: ["websocket"],
      auth: userId
        ? {
            userId,
          }
        : undefined,
    });
    clientSockets.push(clientSocket);
    // only save the serverSocket logic when userId is provided
    if (userId) {
      // the serverSocket obj resolves to the server socket, but we need to create and store the resolve fn
      serverSockets.set(
        userId,
        new Promise<ServerSocketType>((resolve) => {
          serverSocketResolves[userId] = resolve;
        }),
      );
    }

    return clientSocket;
  }

  function getServerSocket(userId: string) {
    return serverSockets.get(userId);
  }

  // TODO: This working in tests feels like a fluke that could mess up with race conditions, if that comes up, probably should rewrite the logic with auto connects and resolve by socketId instead of userId
  // with this function added, the other two probably aren't needed for most cases, but will be exported for the utils testing
  function getBothSockets(userId: string) {
    const clientSocket = getClientSocket(userId);
    clientSocket.connect();
    return Promise.all([
      getServerSocket(userId),
      new Promise<void>((resolve) => {
        clientSocket.on("connect", () => {
          resolve();
        });
      }),
    ]).then(([serverSocket]) => {
      if (!serverSocket) {
        throw new Error(
          "getBothSockets wasn't able to get the server socket for some reason",
        );
      }

      expect(clientSocket).toBeDefined();
      expect(clientSocket.connected).toBeTruthy();
      // common tests can be defined here, to verify the state before continuing.
      expect(serverSocket).toBeDefined();
      expect(serverSocket.data.userId).toBe(userId);
      expect(serverSocket.id).toBe(clientSocket.id);
      expect(serverSocket.rooms.has(userId)).toBeTruthy();
      return {
        serverSocket,
        clientSocket,
      };
    });
  }
  getBothSockets.assertionCount = 6;

  beforeAll((done) => {
    httpServer = createServer();
    const httpServerAddr = httpServer.listen().address() as AddressInfo;
    clientPath = `http://localhost:${httpServerAddr.port}`;
    io = skipHandlers
      ? getSocketServer(httpServer)
      : buildServerSocket(httpServer);
    // set up the connection listener for this socket
    io.on("connection", (socket: ServerSocketType) => {
      const { userId } = socket.data;
      // make sure we have this userId in the relevant promise logics
      const resolver = serverSocketResolves[userId];
      if (resolver) {
        // resolve the socket
        resolver(socket);
      } else {
        throw new Error(
          `No resolver was found for the userId of a connected socket, this shouldn't be possible unless the setup utils have failed`,
        );
      }
    });
    done();
  });

  beforeEach(() => {
    serverSockets = new Map();
    serverSocketResolves = {};
    clientSockets = [];
  });
  afterEach(() => {
    clientSockets.forEach((socket) => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
  });
  afterAll((done) => {
    io.close();
    httpServer.close();
    done();
  });

  return {
    getIO: () => io,
    getClientSocket,
    getServerSocket,
    getBothSockets,
  };
}
