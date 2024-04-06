import { PlayerDataI } from "~/game_logic/game_room/room_types";
import {
  type GameRoomPlayersDataI,
  type GameRoomPlayersI,
  newPlayersData,
  utils as playerUtils,
} from "./players";
import { newGameRoomData, utils } from "./room";

const { getGameRoomFromData } = utils;

jest.mock("./players");
// mock both to return an empty object
const mockedNewPlayers = jest
  .mocked(newPlayersData)
  .mockImplementation(() => ({}) as GameRoomPlayersDataI);
const mockedGetPlayers = jest
  .mocked(playerUtils.getPlayersFromData)
  .mockImplementation(() => ({}) as GameRoomPlayersI);

// both functions to test reference the players functions, am just going to call them too instead of dealing with mocks
describe("gameRoom base logic", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it("newGameRoomData creates empty data obj w/ id", () => {
    const testRoomId = "test_room";
    const room1 = newGameRoomData(testRoomId);
    expect(room1).toEqual({
      roomId: testRoomId,
      chat: [],
      // mocked player data is empty
    });
    expect(mockedNewPlayers).toHaveBeenCalledTimes(1);
    // make a new room with same input. to show they are equal objects but new references
    const room2 = newGameRoomData(testRoomId);
    expect(room2).toEqual(room1);
    expect(room2).not.toBe(room1);
    expect(mockedNewPlayers).toHaveBeenCalledTimes(2);
  });

  // this function doesn't do much but cll getPlayersFromData
  it("getGameRoomFromData", () => {
    const testRoomId = "test_room";
    const room = newGameRoomData(testRoomId);
    // without the player data, this function doesn't change anything yet
    expect(getGameRoomFromData(room)).toEqual({
      roomId: testRoomId,
      chat: [],
    });
    expect(mockedGetPlayers).toHaveBeenCalledTimes(1);
    expect(mockedGetPlayers).toHaveBeenCalledWith(room);
  });
});
