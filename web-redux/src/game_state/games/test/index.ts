
import testSlice from "./test_slice";
import GameView from "./test_game";

import { createGameObj } from "../utils";

export default createGameObj({
    slice: testSlice,
    View: GameView,
})
