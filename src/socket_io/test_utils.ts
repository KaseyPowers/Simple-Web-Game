import { createServer, type Server } from "node:http";
import { type AddressInfo } from "node:net";
import { io as ioc } from "socket.io-client";

import type {
  ServerSocketType,
  ServerType,
  ClientSocketType,
} from "./socket_types";
import { baseClientOptions } from "./socket_configs";
import { getSocketServer } from "./server";
import { Server as SocketServer } from "socket.io";

export function waitFor(
  socket: ServerSocketType | ClientSocketType,
  event: string,
) {
  return new Promise((resolve) => {
    socket.once(event, resolve);
  });
}

type ServerSocketResolver = (
  value: ServerSocketType | PromiseLike<ServerSocketType>,
) => void;

// type getClientSocketFn = () => ClientSocket;
// test setup for initializing the io server
export function testUseSocketIOServer() {
  // NOTE: try 10 second timeout
  jest.setTimeout(10 * 1000);
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
    console.log(`Creating a client for userId: ${userId}`);
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
          console.log(`saving the socket resolver for ${userId}`);
          serverSocketResolves[userId] = resolve;
        }),
      );
    }

    return clientSocket;
  }

  function getServerSocket(userId: string) {
    return serverSockets.get(userId);
  }

  beforeAll((done) => {
    httpServer = createServer();
    const httpServerAddr = httpServer.listen().address() as AddressInfo;
    clientPath = `http://localhost:${httpServerAddr.port}`;
    io = getSocketServer(httpServer);
    done();
  });

  beforeEach(() => {
    serverSockets = new Map();
    serverSocketResolves = {};
    clientSockets = [];
    // set up the connection listener for this socket
    io.on("connection", (socket: ServerSocketType) => {
      console.log("On server connection, checking userId");
      const { userId } = socket.data;
      // make sure we have this userId in the relevant promise logics
      if (serverSocketResolves[userId]) {
        console.log(`${userId} to be resolved`);
        // resolve the socket and delete the record from the
        serverSocketResolves[userId](socket);
      } else {
        console.log("resolver not found?");
      }
    });
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
  };
}
