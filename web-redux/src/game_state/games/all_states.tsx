import emptyGame from "./empty";
import testGame from "./test";

import { ObjectKeys } from "../../utils";
import { BaseGameObj } from "./type";

const allGameStates: {
  [key: string]: BaseGameObj;
} = {
  [emptyGame.id]: emptyGame,
  [testGame.id]: testGame,
} as const;
export type sliceIds = ObjectKeys<typeof allGameStates>;

export default allGameStates;
