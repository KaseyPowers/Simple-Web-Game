import {getGameSelectors} from "../selectors";
import {id} from "./test_slice";

const {gamePlayersSelector} = getGameSelectors(id);

export {
    gamePlayersSelector
};