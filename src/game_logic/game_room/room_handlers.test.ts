/* eslint-disable @typescript-eslint/dot-notation */
/**
 * @jest-environment node
 */

// will use the room logic directly w/ the handlers
import GameRoom from "./room";

import {
  waitFor,
  getEventListener,
  testUseSocketIOServer,
} from "~/socket_io/test_utils";

import type { ChatDataI, GameRoomDataI, PlayerDataI } from "./room_types";
import { disconnectOfflineDelay } from "./room_handlers";

// keep timers moving because socket.io seems to break otherwise
jest.useFakeTimers({
  advanceTimers: true,
});

describe("gameRoom socket_handlers", () => {
  // the socket server in this already adds all handlers so we are good to go
  // NOTE: if I do change that in the future this should break right away
  const { getBothSockets } = testUseSocketIOServer();

  // reset the rooms data between test
  beforeEach(() => {
    // reset the room data between tests
    // eslint-disable-next-line @typescript-eslint/dot-notation
    GameRoom["allRoomsData"] = {};
  });

  describe("create_room", () => {
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
      // check the actual static stored data in GameRoom
      expect(GameRoom.findRoom(roomData.roomId)).toBeDefined();
    });

    it("creating a room only emits room info to joining socket", async () => {
      expect.assertions(getBothSockets.assertionCount * 2 + 2);
      const userId = "test_user";
      const sockets1 = await getBothSockets(userId);
      const sockets2 = await getBothSockets(userId);
      // listen for roomInfo on both sockets
      const listener1 = getEventListener(sockets1.clientSocket, "room_info");
      const listener2 = getEventListener(sockets2.clientSocket, "room_info");

      sockets1.clientSocket.emit("create_room");
      await waitFor(sockets1.clientSocket, "room_info");

      expect(listener1).toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  // setup to quickly create a room before each test in a section.
  function createRoomBeforeEach() {
    const hostId = "host_user_id";
    let hostSockets: Awaited<ReturnType<typeof getBothSockets>>;
    let roomData: GameRoomDataI;

    beforeEach(async () => {
      hostSockets = await getBothSockets(hostId);
      hostSockets.clientSocket.emit("create_room");
      roomData = await waitFor(hostSockets.clientSocket, "room_info");
    });

    return {
      hostId,
      getHostSockets: () => hostSockets,
      getInitialRoomData: () => roomData,
    };
  }

  describe("join_room", () => {
    const { hostId, getHostSockets, getInitialRoomData } =
      createRoomBeforeEach();

    it("should join an existing room", async () => {
      const sockets1 = getHostSockets();
      const { roomId } = getInitialRoomData();

      const secondUser = "test_user_2";
      const sockets2 = await getBothSockets(secondUser);

      // wait for all the updates to come in.
      return Promise.all([
        sockets2.clientSocket.emitWithAck("join_room", roomId),
        waitFor<GameRoomDataI>(sockets2.clientSocket, "room_info"),
        waitFor<[string, PlayerDataI]>(sockets1.clientSocket, "players_update"),
      ]).then(([joinResponse, roomData, playerData]) => {
        expect(joinResponse).toBeUndefined();
        // expect room data to have gotten returned
        expect(roomData).toBeDefined();
        expect(roomData.players).toEqual([hostId, secondUser]);

        expect(playerData[0]).toBe(roomId);
        expect(playerData[1]).toBeDefined();
        expect(playerData[1].players).toEqual([hostId, secondUser]);
      });
    });

    it("should return a string(error) response if room doesn't exist", async () => {
      // to get a roomId we know doesn't exist, the simplist way would be to create a room, get the ID, and then remove that room.
      const { roomId } = getInitialRoomData();
      // the simplist way to close the room while not testing other event logic, we will just access the GameRoom static methods directly
      GameRoom.closeRoom(roomId);
      expect(GameRoom.findRoom(roomId)).toBeUndefined();

      const secondUser = "test_user_2";
      const sockets2 = await getBothSockets(secondUser);

      const joinResponse = await sockets2.clientSocket.emitWithAck(
        "join_room",
        roomId,
      );
      expect(joinResponse).toBeDefined();
      // TODO: Not sure the difference in these two tests, if both pass, will probably go with simpler one
      expect(joinResponse?.message).toEqual(
        expect.stringContaining("That room doesn't exist"),
      );
      expect(joinResponse?.message).toMatch("That room doesn't exist");
    });

    it("should make sure player is online if joining a room they are already in", async () => {
      const { clientSocket } = getHostSockets();
      const { roomId } = getInitialRoomData();

      // make sure there is a second user in the room just to verify extra details
      const secondUser = "test_user_2";
      const sockets2 = await getBothSockets(secondUser);
      await sockets2.clientSocket.emitWithAck("join_room", roomId);

      // get the room and set the player status to false
      const room = GameRoom.findRoom(roomId);
      expect(room).toBeDefined();
      room?.setPlayerStatus(hostId, false);
      // verify the online status is set up correctly
      expect(room?.getPlayerData()).toEqual({
        players: [hostId, secondUser],
        playersOnline: {
          [hostId]: false,
          [secondUser]: true,
        },
      });

      // adding a listener for the players_update event. To verify that the broadcast won't come back to the joining socket's
      const hostUpdateListener = getEventListener(
        clientSocket,
        "players_update",
      );
      // add listeners for other events all at once to avoid worrying about race conditions slowing things down.
      return Promise.all([
        // join the room
        clientSocket.emitWithAck("join_room", roomId),
        // listen for room_info event
        waitFor<GameRoomDataI>(clientSocket, "room_info"),
        // make sure the second user gets the update event
        waitFor<[string, PlayerDataI]>(sockets2.clientSocket, "players_update"),
      ]).then(([joinResponse, roomData, playerData]) => {
        expect(joinResponse).toBeUndefined();
        // expect room data to have gotten returned
        expect(roomData).toBeDefined();
        expect(roomData.players).toEqual([hostId, secondUser]);
        expect(roomData.playersOnline).toEqual({
          [hostId]: true,
          [secondUser]: true,
        });

        // check player data responses
        expect(playerData).toBeDefined();
        expect(playerData[0]).toBe(roomId);
        // check playerData returned is in sync with room_info
        // because we know playerData is a subset of the roomData, this objectContaining setup should woork
        expect(roomData).toEqual(expect.objectContaining(playerData[1]));

        expect(hostUpdateListener).not.toHaveBeenCalled();
      });
    });

    it("should only join from current socket (if user has multiple)", async () => {
      const hostSockets = getHostSockets();
      const { roomId } = getInitialRoomData();
      // second user will get 2 sockets
      const secondUser = "test_user_2";
      const sockets1 = await getBothSockets(secondUser);
      const sockets2 = await getBothSockets(secondUser);

      const secondSocketListener = getEventListener(
        sockets2.clientSocket,
        "room_info",
      );
      // standard setup of all aysnc actions at once to avoid race conditions
      return Promise.all([
        // join the room
        sockets1.clientSocket.emitWithAck("join_room", roomId),
        // listen for room_info event
        waitFor<GameRoomDataI>(sockets1.clientSocket, "room_info"),
        // make sure the host user gets the update event
        waitFor<[string, PlayerDataI]>(
          hostSockets.clientSocket,
          "players_update",
        ),
      ]).then(([joinResponse, roomData, playerData]) => {
        expect(joinResponse).toBeUndefined();
        // expect room data to have gotten returned
        expect(roomData).toBeDefined();
        expect(roomData.players).toEqual([hostId, secondUser]);
        expect(playerData[0]).toBe(roomId);
        // because we know playerData is a subset of the roomData, this objectContaining setup should woork
        expect(roomData).toEqual(expect.objectContaining(playerData[1]));
        expect(secondSocketListener).not.toHaveBeenCalled();
        // extra checks here just to be super sure and show pattern of behavior we are testing
        expect(hostSockets.serverSocket.data.roomId).toBe(roomId);
        expect(sockets1.serverSocket.data.roomId).toBe(roomId);
        // socket 2 should not have joined a room yet
        expect(sockets2.serverSocket.data.roomId).toBeUndefined();
      });
    });

    it("socket should leave current room if joining a new one", async () => {
      const hostSockets = getHostSockets();
      const { roomId } = getInitialRoomData();
      // second user will get 2 sockets
      const secondUser = "test_user_2";
      const sockets2 = await getBothSockets(secondUser);
      const thirdUser = "test_user_3";
      const sockets3 = await getBothSockets(thirdUser);

      sockets2.clientSocket.emit("create_room");
      const secondRoom = await waitFor<GameRoomDataI>(
        sockets2.clientSocket,
        "room_info",
      );

      expect(secondRoom.roomId).toBeDefined();
      expect(roomId).not.toBe(secondRoom.roomId);
      // start with user joining second room
      return Promise.all([
        sockets3.clientSocket.emitWithAck("join_room", secondRoom.roomId),
        waitFor<GameRoomDataI>(sockets3.clientSocket, "room_info"),
      ])
        .then(([joinResponse, roomData]) => {
          // verify joining correctly
          expect(joinResponse).toBeUndefined();
          expect(roomData).toEqual(
            expect.objectContaining({
              roomId: secondRoom.roomId,
              players: [secondUser, thirdUser],
            }),
          );
          // join first room now and verify player left the previous room
          return Promise.all([
            sockets3.clientSocket.emitWithAck("join_room", roomId),
            waitFor<string>(sockets3.clientSocket, "leave_room"),
            waitFor<GameRoomDataI>(sockets3.clientSocket, "room_info"),
            waitFor<[string, PlayerDataI]>(
              sockets2.clientSocket,
              "players_update",
            ),
          ]);
        })
        .then(
          ([
            joinResponse,
            leaveRoomEvent,
            roomData,
            secondRoomPlayersUpdate,
          ]) => {
            expect(joinResponse).toBeUndefined();
            expect(leaveRoomEvent).toBe(secondRoom.roomId);
            expect(roomData).toEqual(
              expect.objectContaining({
                roomId: roomId,
                players: [hostId, thirdUser],
              }),
            );
            expect(secondRoomPlayersUpdate[0]).toBe(secondRoom.roomId);
            expect(secondRoomPlayersUpdate[1]).toEqual({
              players: [secondUser],
              playersOnline: {
                [secondUser]: true,
              },
            });
          },
        );
    });

    it("should close room if joining a new one as last person in room", async () => {
      const hostSockets = getHostSockets();
      const { roomId } = getInitialRoomData();
      // second user will get 2 sockets
      const secondUser = "test_user_2";
      const sockets2 = await getBothSockets(secondUser);

      sockets2.clientSocket.emit("create_room");
      const secondRoom = await waitFor<GameRoomDataI>(
        sockets2.clientSocket,
        "room_info",
      );

      expect(secondRoom.roomId).toBeDefined();
      expect(roomId).not.toBe(secondRoom.roomId);
      // start with user joining second room

      return Promise.all([
        hostSockets.clientSocket.emitWithAck("join_room", secondRoom.roomId),
        waitFor<string>(hostSockets.clientSocket, "leave_room"),
        waitFor<GameRoomDataI>(hostSockets.clientSocket, "room_info"),
      ]).then(([joinResponse, leaveRoomEvent, roomData]) => {
        // verify joining correctly
        expect(joinResponse).toBeUndefined();
        expect(leaveRoomEvent).toBe(roomId);
        expect(roomData).toEqual(
          expect.objectContaining({
            roomId: secondRoom.roomId,
            players: [secondUser, hostId],
          }),
        );
        expect(GameRoom.findRoom(roomId)).toBeUndefined();
      });
    });
  });

  // test leave_room event, which is an automatic leaving by all sockets for this user
  describe("leave_room", () => {
    const { hostId, getHostSockets, getInitialRoomData } =
      createRoomBeforeEach();

    // error tests are might be redundant for the different situations that could cause it, but better safe than sorry espectially if the underlying logic changes later.
    it("should return an error if socket tried leaving when not in a room", async () => {
      const { roomId } = getInitialRoomData();
      // new socket that isn't in any rooms yet
      const secondUser = "test_user_2";
      const newSockets = await getBothSockets(secondUser);
      // verify the room does in face exist
      expect(GameRoom.findRoom(roomId)).toBeDefined();
      // leaving this room shouldn't work even though the room exists, because this socket isn't in any room yet.
      const response = await newSockets.clientSocket.emitWithAck(
        "leave_room",
        roomId,
      );
      expect(response).toBeDefined();
      expect(response?.message).toMatch("Socket couldn't leave that room.");
    });
    it("should return an error if this user is in room but current socket is in a different room", async () => {
      const hostSockets = getHostSockets();
      const { roomId } = getInitialRoomData();
      // more sockets for the same user.
      const sockets2 = await getBothSockets(hostId);
      const sockets3 = await getBothSockets(hostId);

      // let one socket join a new room. validate that it's a new room
      sockets2.clientSocket.emit("create_room");
      const secondRoom: GameRoomDataI = await waitFor(
        sockets2.clientSocket,
        "room_info",
      );
      expect(secondRoom).toBeDefined();
      expect(secondRoom.roomId).not.toBe(roomId);
      // validate all sockets data
      expect(hostSockets.serverSocket.data.roomId).toBe(roomId);
      expect(sockets2.serverSocket.data.roomId).toBe(secondRoom.roomId);
      expect(sockets3.serverSocket.data.roomId).toBeUndefined();
      // verify both game rooms have player listed
      expect(GameRoom.findRoom(roomId)?.["players"]).toEqual([hostId]);
      expect(GameRoom.findRoom(secondRoom.roomId)?.["players"]).toEqual([
        hostId,
      ]);

      // sockets2 leaving first sockets room will fail
      const response1 = await sockets2.clientSocket.emitWithAck(
        "leave_room",
        roomId,
      );
      expect(response1).toBeDefined();
      expect(response1?.message).toMatch("Socket couldn't leave that room.");

      // sockets3 leaving either room will fail
      const response2 = await sockets3.clientSocket.emitWithAck(
        "leave_room",
        roomId,
      );
      expect(response2).toBeDefined();
      expect(response2?.message).toMatch("Socket couldn't leave that room.");
      const response3 = await sockets3.clientSocket.emitWithAck(
        "leave_room",
        secondRoom.roomId,
      );
      expect(response3).toBeDefined();
      expect(response3?.message).toMatch("Socket couldn't leave that room.");

      // validate sockets and game data is unchanged
      expect(hostSockets.serverSocket.data.roomId).toBe(roomId);
      expect(sockets2.serverSocket.data.roomId).toBe(secondRoom.roomId);
      expect(sockets3.serverSocket.data.roomId).toBeUndefined();
      expect(GameRoom.findRoom(roomId)?.["players"]).toEqual([hostId]);
      expect(GameRoom.findRoom(secondRoom.roomId)?.["players"]).toEqual([
        hostId,
      ]);
    });

    it("should leave room and update other players", async () => {
      const hostSockets = getHostSockets();
      const { roomId } = getInitialRoomData();

      const secondUser = "new_user";
      const sockets = await getBothSockets(secondUser);

      return Promise.all([
        sockets.clientSocket.emitWithAck("join_room", roomId),
        await waitFor(sockets.clientSocket, "room_info"),
      ])
        .then(([joinResponse, roomInfo]) => {
          expect(joinResponse).toBeUndefined();
          expect(roomInfo).toEqual(
            expect.objectContaining({
              roomId,
              players: [hostId, secondUser],
            }),
          );

          return Promise.all([
            sockets.clientSocket.emitWithAck("leave_room", roomId),
            waitFor<[string, PlayerDataI]>(
              hostSockets.clientSocket,
              "players_update",
            ),
            waitFor<string>(sockets.clientSocket, "leave_room"),
          ]);
        })
        .then(([leaveResponse, playerData, leftRoomData]) => {
          // leave event acknowledged without error
          expect(leaveResponse).toBeUndefined();
          // check the playerData update for hostId still in room
          expect(playerData[0]).toBe(roomId);
          expect(playerData[1]).toEqual({
            players: [hostId],
            playersOnline: {
              [hostId]: true,
            },
          });
          // server will send a leave_room to the leaving user (redundant for socket that did leave but thorough)
          expect(leftRoomData).toBe(roomId);
        })
        .then(() => {
          // test socket state
          const { serverSocket } = sockets;
          expect(serverSocket.rooms.has(roomId)).toBeFalsy();
          expect(serverSocket.data.roomId).toBeUndefined();
        });
    });

    it("should close the room when last player leaves", async () => {
      const hostSockets = getHostSockets();
      const { roomId } = getInitialRoomData();
      // verify room is still open and only has hostId;
      expect(GameRoom.findRoom(roomId)?.["players"]).toEqual([hostId]);
      return Promise.all([
        hostSockets.clientSocket.emitWithAck("leave_room", roomId),
        waitFor(hostSockets.clientSocket, "leave_room"),
      ])
        .then(([leaveResponse, leaveRoomEvent]) => {
          expect(leaveResponse).toBeUndefined();
          expect(leaveRoomEvent).toBe(roomId);
        })
        .then(() => {
          expect(GameRoom.findRoom(roomId)).toBeUndefined();
        });
    });

    it("closing a room should have any remaining sockets leave too", async () => {
      const hostSockets = getHostSockets();
      const { roomId } = getInitialRoomData();
      const secondUser = "second_user_id";
      const extraSockets = await getBothSockets(secondUser);
      // this scenario shouldn't be possible at this time but will force it by having a socket join the socket-room without joining the gameRoom
      await extraSockets.serverSocket.join(roomId);

      // verify room is still open and only has hostId;
      expect(GameRoom.findRoom(roomId)?.["players"]).toEqual([hostId]);
      return Promise.all([
        hostSockets.clientSocket.emitWithAck("leave_room", roomId),
        waitFor(hostSockets.clientSocket, "leave_room"),
        waitFor(extraSockets.clientSocket, "leave_room"),
      ])
        .then(([leaveResponse, leaveRoomEvent, extraEvent]) => {
          expect(leaveResponse).toBeUndefined();
          expect(leaveRoomEvent).toBe(roomId);
          expect(extraEvent).toBe(roomId);
        })
        .then(() => {
          expect(GameRoom.findRoom(roomId)).toBeUndefined();
        });
    });

    it("should leave the room for all users sockets", async () => {
      const hostSockets = getHostSockets();
      const { roomId } = getInitialRoomData();
      const secondUser = "second_user_id";
      // this is an extra socket that won't join the room
      const extraUserSockets = await getBothSockets(secondUser);
      const extraRoomInfoListener = getEventListener(
        extraUserSockets.clientSocket,
        "room_info",
      );
      const extraLeaveRoomListener = getEventListener(
        extraUserSockets.clientSocket,
        "leave_room",
      );

      const hostPlayersUpdateListener = getEventListener(
        hostSockets.clientSocket,
        "players_update",
      );

      const testSocketCount = 4;
      // first create a bunch of sockets with the same userId
      return Promise.all(
        new Array(testSocketCount).fill(getBothSockets(secondUser)),
      )
        .then(
          (allSockets: Array<Awaited<ReturnType<typeof getBothSockets>>>) => {
            // now have each socket join the same room
            return Promise.all(
              allSockets.map((sockets) => {
                return sockets.clientSocket.emitWithAck("join_room", roomId);
              }),
            ).then((joinEvents) => {
              // expect 4 events and all of them to be falsy/undefined
              expect(joinEvents).toHaveLength(testSocketCount);
              expect(
                joinEvents.every((event) => typeof event === "undefined"),
              ).toBeTruthy();
              // should have only called this once for the single userId joining
              expect(hostPlayersUpdateListener).toHaveBeenCalledTimes(1);
              return allSockets;
            });
          },
        )
        .then((allSockets) => {
          return Promise.all([
            allSockets[0]?.clientSocket.emitWithAck("leave_room", roomId),
            ...allSockets.map((sockets) =>
              waitFor(sockets.clientSocket, "leave_room"),
            ),
          ]).then(([leaveResponse, ...leaveEvents]) => {
            expect(leaveResponse).toBeUndefined();
            expect(leaveEvents).toHaveLength(testSocketCount);
            expect(leaveEvents.every((val) => val === roomId)).toBeTruthy();
            return allSockets;
          });
        })
        .then((allSockets) => {
          expect(extraRoomInfoListener).not.toHaveBeenCalled();
          expect(extraLeaveRoomListener).not.toHaveBeenCalled();
          // expect another call when user left
          expect(hostPlayersUpdateListener).toHaveBeenCalledTimes(2);
          allSockets.forEach((socket) => {
            expect(socket.serverSocket.data.roomId).toBeUndefined();
          });
        });
    });
  });

  describe("disconnect behavior", () => {
    const { hostId, getHostSockets, getInitialRoomData } =
      createRoomBeforeEach();

    it("should temporarily set to offline before removing player from game", async () => {
      const hostSockets = getHostSockets();
      const { roomId } = getInitialRoomData();
      // add another user to the room (to listen for events caused by host disconnect)
      const secondUser = "test_other_user";
      const sockets = await getBothSockets(secondUser);
      await sockets.clientSocket.emitWithAck("join_room", roomId);

      const playersUpdateListener = getEventListener(
        sockets.clientSocket,
        "players_update",
      );
      // verify initial state
      expect(GameRoom.findRoom(roomId)?.["players"]).toEqual([
        hostId,
        secondUser,
      ]);
      expect(GameRoom.findRoom(roomId)?.["playersOnline"]).toEqual({
        [hostId]: true,
        [secondUser]: true,
      });
      // disconnect client socket
      hostSockets.clientSocket.disconnect();
      let playersUpdate: [string, PlayerDataI] = await waitFor(
        sockets.clientSocket,
        "players_update",
      );
      expect(playersUpdate[0]).toBe(roomId);
      expect(playersUpdate[1]).toEqual({
        players: [hostId, secondUser],
        playersOnline: {
          [hostId]: false,
          [secondUser]: true,
        },
      });
      expect(playersUpdateListener).toHaveBeenCalledTimes(1);
      // skip through delay, expect player to have left room now
      jest.advanceTimersByTime(disconnectOfflineDelay);
      playersUpdate = await waitFor(sockets.clientSocket, "players_update");
      expect(playersUpdate[0]).toBe(roomId);
      expect(playersUpdate[1]).toEqual({
        players: [secondUser],
        playersOnline: {
          [secondUser]: true,
        },
      });
      expect(playersUpdateListener).toHaveBeenCalledTimes(2);
    });

    it("will stay in the room if the user joins before time is up", async () => {
      const hostSockets = getHostSockets();
      const { roomId } = getInitialRoomData();
      // add another user to the room (to listen for events caused by host disconnect)
      const secondUser = "test_other_user";
      const sockets = await getBothSockets(secondUser);
      // prepping a second set of sockets to join the room
      // could try hostSockets.clientSocket.connect() as well
      const extraHostSockets = await getBothSockets(hostId);

      await sockets.clientSocket.emitWithAck("join_room", roomId);

      const playersUpdateListener = getEventListener(
        sockets.clientSocket,
        "players_update",
      );
      // verify initial state
      expect(GameRoom.findRoom(roomId)?.["players"]).toEqual([
        hostId,
        secondUser,
      ]);
      expect(GameRoom.findRoom(roomId)?.["playersOnline"]).toEqual({
        [hostId]: true,
        [secondUser]: true,
      });
      // disconnect client socket
      hostSockets.clientSocket.disconnect();
      let playersUpdate: [string, PlayerDataI] = await waitFor(
        sockets.clientSocket,
        "players_update",
      );
      expect(playersUpdate[0]).toBe(roomId);
      expect(playersUpdate[1]).toEqual({
        players: [hostId, secondUser],
        playersOnline: {
          [hostId]: false,
          [secondUser]: true,
        },
      });
      expect(playersUpdateListener).toHaveBeenCalledTimes(1);
      const nextUpdate: Promise<[string, PlayerDataI]> = waitFor(
        sockets.clientSocket,
        "players_update",
      );
      await extraHostSockets.clientSocket.emitWithAck("join_room", roomId);
      // skip through delay, expect player to have left room now
      jest.advanceTimersByTime(disconnectOfflineDelay);
      playersUpdate = await nextUpdate;
      expect(playersUpdate[0]).toBe(roomId);
      expect(playersUpdate[1]).toEqual({
        // the order is especialy important here to make sure they reconnected and not re-joined after being removed
        players: [hostId, secondUser],
        playersOnline: {
          [hostId]: true,
          [secondUser]: true,
        },
      });
      /**
       * This also verifies there were only 2 updates:
       * 1. player offline
       * 2. player online
       *
       * As opposed to:
       * 1. player offline
       * 2. player removed
       * 3. player re-joined
       */
      expect(playersUpdateListener).toHaveBeenCalledTimes(2);
    });

    it("nothing happens if user has other sockets in the room", async () => {
      const hostSockets = getHostSockets();
      const { roomId } = getInitialRoomData();
      // add another user to the room (to listen for events caused by host disconnect)
      const secondUser = "test_other_user";
      const sockets = await getBothSockets(secondUser);
      // prepping a second set of sockets to join the room
      // could try hostSockets.clientSocket.connect() as well
      const extraHostSockets = await getBothSockets(hostId);

      await sockets.clientSocket.emitWithAck("join_room", roomId);
      await extraHostSockets.clientSocket.emitWithAck("join_room", roomId);

      const playersUpdateListener = getEventListener(
        sockets.clientSocket,
        "players_update",
      );
      // verify initial state
      expect(GameRoom.findRoom(roomId)?.["players"]).toEqual([
        hostId,
        secondUser,
      ]);
      expect(GameRoom.findRoom(roomId)?.["playersOnline"]).toEqual({
        [hostId]: true,
        [secondUser]: true,
      });
      // disconnect client socket
      hostSockets.clientSocket.disconnect();
      // skip through delay, expect player to have left room now if they would
      expect(playersUpdateListener).not.toHaveBeenCalled();
    });
  });

  describe("message event", () => {
    const { hostId, getHostSockets, getInitialRoomData } =
      createRoomBeforeEach();

    it("should return undefined if message is valid", async () => {
      const { roomId } = getInitialRoomData();
      const hostSockets = getHostSockets();
      // new socket that isn't in any rooms yet

      const testMsg: ChatDataI = {
        roomId,
        userId: hostId,
        msg: "test message",
      };
      const msgResponse = await hostSockets.clientSocket.emitWithAck(
        "message",
        testMsg,
      );
      expect(msgResponse).toBeUndefined();
      const room = GameRoom.findRoom(roomId);
      expect(room?.["chat"]).toEqual([testMsg]);
    });

    it("should return an error if roomId or userId doesn't match the sending sockets state", async () => {
      const { roomId } = getInitialRoomData();
      const hostSockets = getHostSockets();
      // new socket that isn't in any rooms yet
      const secondUser = "test_user_2";
      const newSockets = await getBothSockets(secondUser);
      newSockets.clientSocket.emit("create_room");
      const newRoomInfo: GameRoomDataI = await waitFor(
        newSockets.clientSocket,
        "room_info",
      );
      const newRoomId = newRoomInfo.roomId;
      // verify new room made and different from initial room
      expect(newRoomId).toBeDefined();
      expect(newRoomId).not.toBe(roomId);

      const testMsg: ChatDataI = {
        roomId: newRoomId,
        userId: hostId,
        msg: "test message",
      };

      const badRoomResponse = await hostSockets.clientSocket.emitWithAck(
        "message",
        testMsg,
      );
      expect(badRoomResponse?.message).toMatch("Bad roomId");

      const badUserResponse = await newSockets.clientSocket.emitWithAck(
        "message",
        testMsg,
      );
      expect(badUserResponse?.message).toMatch("Bad userId");
    });

    it("should emit a message update to all other sockets in the room", async () => {
      const { roomId } = getInitialRoomData();
      const hostSockets = getHostSockets();
      // new socket that isn't in any rooms yet
      const secondUser = "test_user_2";
      const newSockets = await getBothSockets(secondUser);
      const joinResponse = await newSockets.clientSocket.emitWithAck(
        "join_room",
        roomId,
      );
      expect(joinResponse).toBeUndefined();

      const testMsg: ChatDataI = {
        roomId,
        userId: hostId,
        msg: "test message",
      };

      return Promise.all([
        hostSockets.clientSocket.emitWithAck("message", testMsg),
        waitFor<ChatDataI>(newSockets.clientSocket, "message"),
      ]).then(([msgResponse, msgEvent]) => {
        expect(msgResponse).toBeUndefined();
        expect(msgEvent).toEqual(testMsg);

        const room = GameRoom.findRoom(roomId);
        expect(room?.["chat"]).toEqual([testMsg]);
      });
    });
  });
});
