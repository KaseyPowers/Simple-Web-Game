/**
 * @jest-environment node
 */
import { makeUpdaterCall } from "../../updater_test_utils";
import { type GameRoomDataI, newGameRoomData } from "./room";

import {
  type GameRoomPlayersDataI,
  newPlayersData,
  utils,
  updaters,
} from "./players";

const testPlayerId = "test_player_id";
const otherPlayerId = "test_other_player_id";

describe("gameRoom Players", () => {
  it("newPlayersData returns a new empty data obj", () => {
    const data1 = newPlayersData();
    // expect the object key with empty array/sets
    expect(data1).toEqual({
      players: [],
      offlinePlayers: new Set(),
    });
    const data2 = newPlayersData();
    // creates a new object each time
    expect(data2).not.toBe(data1);
    // but objects always same contents
    expect(data2).toEqual(data1);
  });

  describe("utils", () => {
    // basic empty playerData/roomData
    let data1: GameRoomPlayersDataI;
    let room1: GameRoomDataI;
    // playerData/roomData with values
    let data2: GameRoomPlayersDataI;
    let room2: GameRoomDataI;

    beforeEach(() => {
      data1 = newPlayersData();
      room1 = newGameRoomData("randomId");
      data2 = {
        players: [testPlayerId, otherPlayerId],
        offlinePlayers: new Set([testPlayerId, otherPlayerId]),
      };
      room2 = {
        ...room1,
        ...data2,
      };
    });

    it("getPlayersFromData returns a simplified structure for sending", () => {
      // just confirm expected behavior, current implementation doesn't have room to do much
      // basic empty data
      expect(utils.getPlayersFromData(data1)).toEqual({
        players: [],
        offlinePlayers: [],
      });
      // some data with values
      expect(utils.getPlayersFromData(data2)).toEqual({
        players: [testPlayerId, otherPlayerId],
        offlinePlayers: expect.arrayWith([testPlayerId, otherPlayerId]),
      });

      // validate it works with full room objects too
      expect(utils.getPlayersFromData(room1)).toEqual({
        players: [],
        offlinePlayers: [],
      });
      expect(utils.getPlayersFromData(room2)).toEqual({
        players: [testPlayerId, otherPlayerId],
        offlinePlayers: expect.arrayWith([testPlayerId, otherPlayerId]),
      });
    });

    it("gameRoomIsEmpty checks if players array is empty", () => {
      // basic empty data
      expect(data1.players).toEqual([]);
      expect(utils.gameRoomIsEmpty(data1)).toBe(true);
      // some data with values
      expect(data2.players).toEqual([testPlayerId, otherPlayerId]);
      expect(utils.gameRoomIsEmpty(data2)).toBe(false);
      // validate it works with full room objects too
      expect(utils.gameRoomIsEmpty(room1)).toBe(true);
      expect(utils.gameRoomIsEmpty(room2)).toBe(false);
    });
    it("isPlayerInRoom returns if player is in the players array", () => {
      // we know array is empty and always false
      expect(utils.isPlayerInRoom(data1, testPlayerId)).toBe(false);
      expect(utils.isPlayerInRoom(data1, otherPlayerId)).toBe(false);
      expect(utils.isPlayerInRoom(room1, testPlayerId)).toBe(false);
      expect(utils.isPlayerInRoom(room1, otherPlayerId)).toBe(false);
      // lazy id seperate from 2 we know are in the rest of data
      const thirdId = [testPlayerId, otherPlayerId].join("-");
      expect(utils.isPlayerInRoom(data2, testPlayerId)).toBe(true);
      expect(utils.isPlayerInRoom(data2, thirdId)).toBe(false);
      expect(utils.isPlayerInRoom(room2, testPlayerId)).toBe(true);
      expect(utils.isPlayerInRoom(room2, thirdId)).toBe(false);
    });
    it("validatePlayerInRoom throws an error if not in room", () => {
      // we know array is empty and always false
      expect(() => {
        utils.validatePlayerInRoom(data1, testPlayerId);
      }).toThrow("Can't perform action");
      expect(() => {
        utils.validatePlayerInRoom(data1, otherPlayerId);
      }).toThrow("Can't perform action");
      expect(() => {
        utils.validatePlayerInRoom(room1, testPlayerId);
      }).toThrow("Can't perform action");
      expect(() => {
        utils.validatePlayerInRoom(room1, otherPlayerId);
      }).toThrow("Can't perform action");
      // lazy id seperate from 2 we know are in the rest of data
      const thirdId = [testPlayerId, otherPlayerId].join("-");
      expect(() =>
        utils.validatePlayerInRoom(data2, testPlayerId),
      ).not.toThrow();
      expect(() => utils.validatePlayerInRoom(data2, thirdId)).toThrow(
        "Can't perform action",
      );
      expect(() =>
        utils.validatePlayerInRoom(room2, testPlayerId),
      ).not.toThrow();
      expect(() => utils.validatePlayerInRoom(room2, thirdId)).toThrow(
        "Can't perform action",
      );
    });
  });
  describe("updaters", () => {
    // basic empty roomData
    let room1: GameRoomDataI;
    // roomData with values
    let room2: GameRoomDataI;

    beforeEach(() => {
      room1 = {
        ...newGameRoomData("randomId"),
      };
      room2 = {
        ...newGameRoomData("differentId"),
        players: [testPlayerId, otherPlayerId],
        offlinePlayers: new Set([testPlayerId]),
      };
    });
    describe("setPlayerIsOffline", () => {
      it("will throw an error if player not in room", () => {
        // using room1 with no users in it to always fail
        // not bothering with the mock call wrapper when we know it fails
        expect(() => {
          updaters.setPlayerIsOffline(room1, testPlayerId, false);
        }).toThrow("Can't perform action");
        // doesn't care about offline status being set
        expect(() => {
          updaters.setPlayerIsOffline(room1, testPlayerId, true);
        }).toThrow("Can't perform action");
      });
      it("will no have changes if player's offline status matches call", () => {
        // when creating room2, testPlayerId is already offline
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.setPlayerIsOffline,
            room2,
            testPlayerId,
            true,
          ),
        ).toEqual([room2, false]);
        // we know otherPlayerId is online so a falsy set shouldn't cange
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.setPlayerIsOffline,
            room2,
            otherPlayerId,
            false,
          ),
        ).toEqual([room2, false]);
      });
      it("will return new values with changes", () => {
        // when creating room2, testPlayerId is already offline

        // set testPlayerId to online, so new set is empty
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.setPlayerIsOffline,
            room2,
            testPlayerId,
            false,
          ),
        ).toEqual([
          {
            ...room2,
            offlinePlayers: new Set([]),
          },
          true,
        ]);
        // we know otherPlayerId is online so a truthy change will add it to the offline set
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.setPlayerIsOffline,
            room2,
            otherPlayerId,
            true,
          ),
        ).toEqual([
          {
            ...room2,
            offlinePlayers: new Set([testPlayerId, otherPlayerId]),
          },
          true,
        ]);
      });
    });

    // wrapper of setPlayerIsOffline that always sets to online
    describe("onPlayerAction", () => {
      // expect the same validation logic
      it("will throw an error if player not in room", () => {
        // using room1 with no users in it to always fail
        // not bothering with the mock call wrapper when we know it fails
        expect(() => {
          updaters.onPlayerAction(room1, testPlayerId);
        }).toThrow("Can't perform action");
        // doesn't care about offline status being set
        expect(() => {
          updaters.onPlayerAction(room1, testPlayerId);
        }).toThrow("Can't perform action");
      });
      it("will make sure playerId is online", () => {
        // when creating room2, testPlayerId is already offline
        // first with an id that is already online
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.onPlayerAction,
            room2,
            otherPlayerId,
          ),
        ).toEqual([room2, false]);
        // testPlayerId is offline so will trigger a change
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.onPlayerAction,
            room2,
            testPlayerId,
          ),
        ).toEqual([
          {
            ...room2,
            offlinePlayers: new Set([]),
          },
          true,
        ]);
      });
    });

    describe("addPlayer", () => {
      it("will update room with new player", () => {
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.addPlayer,
            room1,
            testPlayerId,
          ),
        ).toEqual([
          {
            ...room1,
            players: [testPlayerId],
          },
          true,
        ]);
      });
      it("adding existing (online) player does nothing", () => {
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.addPlayer,
            room2,
            otherPlayerId,
          ),
        ).toEqual([room2, false]);
      });
      it("makes sure added player is online if already in room", () => {
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.addPlayer,
            room2,
            testPlayerId,
          ),
        ).toEqual([
          {
            ...room2,
            offlinePlayers: new Set(),
          },
          true,
        ]);
      });
    });

    describe("removePlayer", () => {
      it("does nothing if player not in room", () => {
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.removePlayer,
            room1,
            testPlayerId,
          ),
        ).toEqual([room1, false]);
      });
      it("removes player from playerList", () => {
        // simple test, otherPlayerId is in room but online
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.removePlayer,
            room2,
            otherPlayerId,
          ),
        ).toEqual([
          {
            ...room2,
            players: [testPlayerId],
          },
          true,
        ]);
      });
      it("removes player from playerList and offlinePlayers", () => {
        // simple test, otherPlayerId is in room but online
        expect(
          makeUpdaterCall<GameRoomDataI>(
            updaters.removePlayer,
            room2,
            testPlayerId,
          ),
        ).toEqual([
          {
            ...room2,
            players: [otherPlayerId],
            offlinePlayers: new Set(),
          },
          true,
        ]);
      });
      it("will throw an error on a broken room with playerId not in player list but in the offlinePlayers set", () => {
        //manually creating an invalid room
        const badRoom = {
          ...room1,
          offlinePlayers: new Set([testPlayerId]),
        };
        expect(() => {
          updaters.removePlayer(badRoom, testPlayerId);
        }).toThrow("This shouldn't be possible");
      });
    });
  });
});
