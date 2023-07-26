
import emptySlice from "./empty_slice";
import GameView from "./empty_game";

import { createGameObj } from "../utils";

export default createGameObj({
    slice: emptySlice,
    View: GameView,
})
