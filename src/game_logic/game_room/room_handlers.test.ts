/**
 * @jest-environment node
 */

// will use the room logic directly w/ the handlers
import GameRoom from "./room";
import type {GameRoomDataI, PlayerDataI} from "./room_types";

import { waitFor, testUseSocketIOServer } from "~/socket_io/test_utils";


  // NOTE: try 20 second timeout
  jest.setTimeout(20 * 1000);

describe("gameRoom socket_handlers", () => {
    // the socket server in this already adds all handlers so we are good to go
    // NOTE: if I do change that in the future this should break right away 
  const { getBothSockets } =
    testUseSocketIOServer();

    // reset the rooms data between test
    beforeEach(() => {
      // reset the room data between tests
      // eslint-disable-next-line @typescript-eslint/dot-notation
      GameRoom['allRoomsData'] = {};
  });

  describe("create_room event", () => {
    it("creates a gameRoom, joins the socket room, and emit room_info", async () => {
      const userId = "test_user";
      const { serverSocket, clientSocket } = await getBothSockets(userId);
      clientSocket.emit("create_room");
      const roomData: GameRoomDataI = await waitFor(clientSocket, "room_info");
      // expect room data to have gotten returned
      expect(roomData).toBeDefined();
      expect(roomData.players).toEqual([userId]);
      // using client data, verify it matches socket state
      expect(serverSocket.rooms.has(roomData.roomId)).toBeTruthy();
      expect(serverSocket.data.roomId).toBe(roomData.roomId);
    });

    it("creating a room only emits room info to joining socket", async () => {
      expect.assertions((getBothSockets.assertionCount * 2) + 2);
      const userId = "test_user";
      const sockets1 = await getBothSockets(userId);
      const sockets2 = await getBothSockets(userId);
      // listen for roomInfo on both sockets
      const listener1 = jest.fn();
      sockets1.clientSocket.on("room_info", listener1);
      const listener2 = jest.fn();      
      sockets2.clientSocket.on("room_info", listener2);

      sockets1.clientSocket.emit("create_room");
      await waitFor(sockets1.clientSocket, "room_info");

      expect(listener1).toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe("join_room", () => {
    it("should join an existing room", async () => {
      const userId = "test_user";      
      const sockets1 = await getBothSockets(userId);
      const secondUser = "test_user_2"
      const sockets2 = await getBothSockets(secondUser);
      
      sockets1.clientSocket.emit("create_room");
      const {roomId}: GameRoomDataI = await waitFor(sockets1.clientSocket, "room_info");
      // wait for all the updates to come in.
      return Promise.all([
        sockets2.clientSocket.emitWithAck("join_room", roomId),
        waitFor(sockets2.clientSocket, "room_info") as Promise<GameRoomDataI>,
        waitFor(sockets1.clientSocket, "players_update") as Promise<[string, PlayerDataI]>,
      ]).then(([joinResponse, roomData, responseSocket1]) => {
        expect(joinResponse).toBe(true);
        // expect room data to have gotten returned
        expect(roomData).toBeDefined();
        expect(roomData.players).toEqual([userId, secondUser]);

        expect(responseSocket1[0]).toBe(roomId);        
        expect(responseSocket1[1]).toBeDefined();
        expect(responseSocket1[1].players).toEqual([userId, secondUser]);

        
        // expect(responseSocket2[0]).toBe(roomId);        
        // expect(responseSocket2[1]).toBeDefined();
        // expect(responseSocket2[1].players).toEqual([userId, secondUser]);
      })
    });
  })
});
