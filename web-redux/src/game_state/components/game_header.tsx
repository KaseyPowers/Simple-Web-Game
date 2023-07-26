import React from "react";
import { Stack, Button } from "@mui/material";

import testGame from "../games/test";
import { selectGameName } from "../utils";
import { useAppSelector } from "../../app/hooks";
import { setGameStateReducer } from "../../app/store";

const testStateId = testGame.id;
const testStateName = testGame.name;

function GameStateHeader() {
  const gameName = useAppSelector(selectGameName);
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <h1>Name: {gameName}</h1>
      <Button
        disabled={gameName === testStateName}
        onClick={() => {
          setGameStateReducer(testStateId);
        }}
      >
        Set to {testStateName}
      </Button>
    </Stack>
  );
}

export default GameStateHeader;
