import cryptoRandomString from "crypto-random-string";

import type { ChatDataI, GameRoomDataI, PlayerDataI } from "./room_types";
/**
 * NOTES:
 * - Should I have the sockets use the roomId raw or do something like `room_${roomId}`
 * - Should I be using callbacks to return errors or let the thrown errors do whatever they do?
 */

export default class GameRoom {
  readonly roomId: string;

  // Quick Static attributes + functions
  // track all the games that are active
  private static allRoomsData: Record<string, GameRoom> = {};

  static findRoom(roomId: string) {
    return this.allRoomsData[roomId];
  }
  /**
   * Remove this room from global tracking. Should be called automatically when the last player leaves a room. (by the handlers)
   * TODO: Set up some kind of timer to remove rooms that are inactive for too long?
   */
  static closeRoom(roomId: string) {
    delete GameRoom.allRoomsData[roomId];
  }
  closeRoom() {
    GameRoom.closeRoom(this.roomId);
  }

  protected chat: ChatDataI[] = [];

  /**
   * Track all the players that are in this room.
   * Will have a system for checking for disconects from multiple tabs before dropping them from the list.
   * Also will have the host/admin/manager/term-tbd just be whoever is at index-0
   */
  protected players: string[] = [];
  get isEmpty() {
    return this.players.length <= 0;
  }

  /**
   * Tracking if a player is online or not
   */
  protected playersOnline: Record<string, boolean> = {};

  // fn will make sure the playersOnline keys matches the players in room
  protected verifyOnlineObj() {
    // rebuilding the object each time might not be as efficient but is readable approach for now:
    this.playersOnline = this.players.reduce<typeof this.playersOnline>(
      (output, userId) => {
        return {
          ...output,
          // default to assuming any player added for the first time is online
          [userId]: this.playersOnline[userId] ?? true,
        };
      },
      {},
    );
  }

  getPlayerData(): PlayerDataI {
    return {
      players: this.players,
      playersOnline: this.playersOnline,
    };
  }
  getData(): GameRoomDataI {
    return {
      roomId: this.roomId,
      chat: this.chat,
      ...this.getPlayerData(),
    };
  }

  // TODO: Game config + instance
  // TODO: Metadata tracking ex. games played, player wins, etc.

  // constructor called with the userId of whoever creates the room as admin
  constructor(userId: string) {
    this.players = [];
    this.playersOnline = {};

    this.addPlayer(userId);

    // setting roomId is last step before adding to the object
    // NOTE: using library to make a shorter id that will be easier to type manually into a browser if that's how it's being shared.
    this.roomId = cryptoRandomString({ length: 6, type: "distinguishable" });

    // add this gameRoom instance to the object
    if (GameRoom.allRoomsData[this.roomId]) {
      throw new Error(
        `Somehow created a room for an id that already exists! roomId: ${this.roomId}, !!GameRoom.allRoomsData[roomId]: ${!!GameRoom.allRoomsData[this.roomId]}`,
      );
    }
    GameRoom.allRoomsData[this.roomId] = this;
  }

  // update players online status, and returns flag if this caused a change
  setPlayerStatus(userId: string, status = true): boolean {
    // skip when players doesn't have this user
    if (!this.players.includes(userId)) {
      return false;
    }
    // check if the new status matches existing one
    const changed = this.playersOnline[userId] !== status;
    this.playersOnline[userId] = status;
    return changed;
  }
  // use this to add to the memory, will let socket listener handle rebroadcasting
  addChatMessage(msg: ChatDataI) {
    // worth double checking the msg is going to this roomId before saving
    if (msg.roomId !== this.roomId) {
      throw new Error(
        `Tried adding a chat message to the wrong room. Expected: ${this.roomId}, Received: ${msg.roomId}`,
      );
    }
    // make sure this player is part of this room
    if (!this.players.includes(msg.userId)) {
      // NOTE: Should I throw an error here or just ignore it like add/removePlayer and playerStatus functions?
      throw new Error("Message sent by user not in this room");
    }
    this.chat.push(msg);
  }

  // return true if a change happened
  addPlayer(newId: string): boolean {
    // make sure to only add an id if it's not already in the player list
    if (!this.players.includes(newId)) {
      this.players.push(newId);
      // NOTE: verify defaults to true, so don't need to use playerActivity check.
      this.verifyOnlineObj();
      return true;
    }
    // we hit this condition only if the userId already in the room
    // so treat re-adding the user as verifying they are online
    return this.setPlayerStatus(newId, true);
  }

  // call when they leave the room, let socket logic handle these checks with a timeout for disconnects
  removePlayer(removeId: string): boolean {
    // return early if this id isn't a player
    if (!this.players.includes(removeId)) {
      return false;
    }
    // remove this id from the players. will assume host changes are handled automatically
    this.players = this.players.filter((userId) => userId !== removeId);
    this.verifyOnlineObj();

    return true;
  }
}
