
import testSlice, { id } from "./test_slice";
import GameView from "./test_game";

import { createGameObj } from "../utils";

export { id };

export default createGameObj({
    id,
    slice: testSlice,
    View: GameView,
})
