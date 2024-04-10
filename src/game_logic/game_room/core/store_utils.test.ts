import { newGameRoomData } from "./room";
// import store to validate with
import { allGameRooms } from "../../shared_store";

import cryptoRandomString from "crypto-random-string";

import {
  getRoomById,
  setRoom,
  removeRoom,
  addNewRoom,
  inputRoomId,
  inputRoom,
  inputStoreRoom,
  getRoom,
} from "./store_utils";

jest.mock("crypto-random-string");

const mockedRandomString = jest.mocked(cryptoRandomString);
// const mockedRandomString: jest.Mocked<typeof cryptoRandomString> = jest.mocked(cryptoRandomString);

// super simple implementation, a number that increments and return a string for it
let roomCount = 0;
mockedRandomString.mockImplementation(() => {
  roomCount += 1;
  return `room_id_${roomCount}`;
});

describe("gameRooms store utils", () => {
  const testRoomId = "Test_Room_Id_exists";
  const testRoom = newGameRoomData(testRoomId);
  beforeEach(() => {
    // I'm not loving this way of resetting the gameRooms but seems like the best option to reset the gameRooms
    Object.keys(allGameRooms).forEach((key) => {
      delete allGameRooms[key];
    });
    // temp expect to confirm this beforeEach
    allGameRooms[testRoomId] = testRoom;
  });
  // just do something to the room to verify it's reset correctly
  it("modify test to verify reset", () => {
    const helloWorldRoom = newGameRoomData("Hello World");
    allGameRooms.some_random_id = helloWorldRoom;
    expect(allGameRooms).toEqual({
      some_random_id: helloWorldRoom,
      [testRoomId]: testRoom,
    });
  });

  // make sure the store has been reset to the expected state
  it("should have reset global store", () => {
    expect(allGameRooms).toEqual({
      [testRoomId]: testRoom,
    });
  });

  it("getRoomById returns the room from id", () => {
    expect(getRoomById(testRoomId)).toBe(testRoom);
  });

  it("setRoom can add new room", () => {
    const newRoomId = "Extra Room Id";
    // make sure id's don't overlap just in case
    expect(newRoomId).not.toEqual(testRoomId);
    const newRoom = newGameRoomData(newRoomId);
    setRoom(newRoom);
    expect(allGameRooms).toEqual({
      [testRoomId]: testRoom,
      [newRoomId]: newRoom,
    });
  });

  it("setRoom can replace/update a room", () => {
    const copyTestRoom = {
      ...testRoom,
      players: ["Howdy world"],
    };
    // verify before
    expect(allGameRooms).toEqual({
      [testRoomId]: testRoom,
    });
    setRoom(copyTestRoom);
    // make sure we aren't changing the original value
    expect(copyTestRoom).not.toEqual(testRoom);
    expect(allGameRooms).toEqual({
      [testRoomId]: copyTestRoom,
    });
  });

  it("removeRoom removes room (or id) from store", () => {
    const newRoomId = "Extra Room Id";
    const newRoom = newGameRoomData(newRoomId);
    allGameRooms[newRoomId] = newRoom;
    // verify before
    expect(allGameRooms).toEqual({
      [testRoomId]: testRoom,
      [newRoomId]: newRoom,
    });
    // remove room with room obj
    removeRoom(newRoom);
    expect(allGameRooms).toEqual({
      [testRoomId]: testRoom,
    });
    // remove room by id
    removeRoom(testRoomId);
    expect(allGameRooms).toEqual({});
  });

  // such a long title
  it("removeRoom warns if trying to remove room not in the store", () => {
    const spiedWarn: jest.Spied<typeof console.warn> = jest
      .spyOn(console, "warn")
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});

    const knownMissingId = "Extra Room Id";
    // make sure name is valid
    expect(Object.keys(allGameRooms)).not.toContain(knownMissingId);
    removeRoom(knownMissingId);
    expect(spiedWarn).toHaveBeenCalledTimes(1);
    expect(spiedWarn).toHaveBeenLastCalledWith(
      expect.stringContaining(`Attempting to remove room ${knownMissingId}`),
    );

    // remove once correctly
    removeRoom(testRoom);
    expect(allGameRooms).toEqual({});
    // try to remove a room a second time
    removeRoom(testRoom);
    expect(spiedWarn).toHaveBeenCalledTimes(2);
    expect(spiedWarn).toHaveBeenLastCalledWith(
      expect.stringContaining(`Attempting to remove room ${testRoomId}`),
    );
    // restore the console since it's not needed for other tests
    spiedWarn.mockRestore();
  });

  it("addNewRoom returns a new room after adding it to store", () => {
    // generate the new room
    const newRoom = addNewRoom();
    // validate the state of store
    expect(allGameRooms).toEqual({
      [testRoomId]: testRoom,
      [newRoom.roomId]: newRoom,
    });
  });
  it("addNewRoom throws error if generated room already exists somehow", () => {
    // have the roomId generator return the existing roomId
    mockedRandomString.mockReturnValueOnce(testRoomId);
    expect(() => {
      addNewRoom();
    }).toThrow("created a room for an id that already exists");
  });
  it("inputRoomId handles room or an input id", () => {
    // check with testRoom
    expect(inputRoomId(testRoomId)).toBe(testRoomId);
    expect(inputRoomId(testRoom)).toBe(testRoomId);
    // check with a second room just to be super sure
    const secondRoomId = "Other_Room";
    const secondRoom = newGameRoomData(secondRoomId);
    expect(inputRoomId(secondRoomId)).toBe(secondRoomId);
    expect(inputRoomId(secondRoom)).toBe(secondRoomId);
  });

  it("inputRoom returns given room or tries to get from store", () => {
    // check with testRoom
    // verify it is in the store
    expect(allGameRooms).toEqual({
      [testRoomId]: testRoom,
    });
    expect(inputRoom(testRoom)).toBe(testRoom);
    expect(inputRoom(testRoomId)).toBe(testRoom);

    // check with a second that isn't in the store
    const secondRoomId = "Other_Room";
    const secondRoom = newGameRoomData(secondRoomId);
    // will return a given room
    expect(inputRoom(secondRoom)).toBe(secondRoom);
    // but will be undefined for roomId not in the store
    expect(inputRoom(secondRoomId)).toBeUndefined();

    // make a copy of testRoom with same id but different content
    const otherTestRoom = newGameRoomData(testRoomId);
    expect(otherTestRoom.roomId).toBe(testRoom.roomId);
    expect(otherTestRoom).not.toBe(testRoom);
    // will return the given room but the store's id value
    expect(inputRoom(otherTestRoom)).toBe(otherTestRoom);
    expect(inputRoom(otherTestRoom.roomId)).not.toBe(otherTestRoom);
    expect(inputRoom(otherTestRoom.roomId)).toBe(testRoom);
  });

  it("inputStoreRoom like inputRoom but always returns the store's room", () => {
    // verify testRoom is in the store
    expect(allGameRooms).toEqual({
      [testRoomId]: testRoom,
    });
    // verify best case scenario testRoom
    expect(inputStoreRoom(testRoom)).toBe(testRoom);
    expect(inputStoreRoom(testRoomId)).toBe(testRoom);

    // check with a second that isn't in the store
    const secondRoomId = "Other_Room";
    const secondRoom = newGameRoomData(secondRoomId);
    // will always return undefined since it's not in the store
    expect(inputStoreRoom(secondRoom)).toBeUndefined();
    expect(inputStoreRoom(secondRoomId)).toBeUndefined();

    // make a copy of testRoom with same id but different content
    const otherTestRoom = newGameRoomData(testRoomId);
    expect(otherTestRoom.roomId).toBe(testRoom.roomId);
    expect(otherTestRoom).not.toBe(testRoom);
    // will return the given room but the store's id value
    expect(inputStoreRoom(otherTestRoom)).toBe(testRoom);
    expect(inputStoreRoom(otherTestRoom.roomId)).toBe(testRoom);
  });

  // validated room getter
  describe("getRoom", () => {
    it("returns room from store from id", () => {
      expect(getRoom(testRoomId)).toBe(testRoom);
    });
    it("returns given room as long as it's id is in the store", () => {
      // make a copy of testRoom with same id but "different" content (toBe won't match, but equal still will)
      const otherTestRoom = newGameRoomData(testRoomId);
      expect(getRoom(testRoom)).toBe(testRoom);
      expect(getRoom(otherTestRoom)).toBe(otherTestRoom);
    });

    it("throws errors for rooms not in the store", () => {
      // create a new room that isn't in the store
      const secondRoomId = "Other_Room";
      const secondRoom = newGameRoomData(secondRoomId);
      // two checks because different errors depending on input type
      expect(() => {
        getRoom(secondRoomId);
      }).toThrow("No room was found");
      expect(() => {
        getRoom(secondRoom);
      }).toThrow(`room's id (${secondRoomId}) was not found in the store`);
    });
  });
});
