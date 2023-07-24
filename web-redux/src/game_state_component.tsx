import React from "react";
import { Button } from "@mui/material";

import testState from "./app/game_state/slices/test_slice";
import { selectGameName } from "./app/game_state/utils";
import { useAppSelector } from "./app/hooks";
import { setGameStateReducer } from "./app/store";

const testStateId = testState.id;
const testStateName = testState.slice.getInitialState().name;

function GameStateDisplay() {
  const gameName = useAppSelector(selectGameName);
  return (
    <>
      <h1>Name: {gameName}</h1>
      <Button
        disabled={gameName === testStateName}
        onClick={() => {
          setGameStateReducer(testStateId);
        }}
      >
        Set to {testStateName}
      </Button>
    </>
  );
}

export default GameStateDisplay;
