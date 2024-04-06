import type { InputParserFn, UpdaterFnInput } from "../../updater_types";
import { createUpdaterBuilder } from "../../updater";
import type { GameRoomDataI } from "./room";
import { type RoomOrId, getRoom, setRoom } from "./store_utils";
import { coreUpdaters } from "./core_udpaters";

export const inputParser: InputParserFn<GameRoomDataI, string> = (
  input: UpdaterFnInput<GameRoomDataI, string>,
) => {
  /**
   * use this to grab the room(orId) + hasChanged from input.
   * the way this step is set up, means we could also accept an input type of [roomId, hasChanged], but that doesn't seem neccesary
   * NOTE: This will work because the `getRoom` validator will return a passed in room unchanged. but need to keep an eye on that with regression tests in case it changes
   */
  const [inputRoomOrId, inputChanged]: [RoomOrId, boolean] = Array.isArray(
    input,
  )
    ? input
    : [input, false];

  // getRoom will get the room if an ID is passed in, also will validate that the room exists
  return [getRoom(inputRoomOrId), inputChanged];
};

const { mapExtendUpdaters } = createUpdaterBuilder<GameRoomDataI, string>({
  inputParser,
  onChangeFns: [
    // this function will be called whenever an updater gets a new room, so we know this is a new room here.
    (room) => {
      // assuming the roomId doesn't change (it shouldn't do that), this fn will update the store for this roomId
      setRoom(room);
    },
  ],
});

export const storeUpdaters = mapExtendUpdaters(coreUpdaters);
