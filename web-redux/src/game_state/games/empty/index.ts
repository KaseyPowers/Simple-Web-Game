
import emptySlice, { id } from "./empty_slice";
import GameView from "./empty_game";

import { createGameObj } from "../utils";

export { id };
export default createGameObj({
    id,
    slice: emptySlice,
    View: GameView,
})
