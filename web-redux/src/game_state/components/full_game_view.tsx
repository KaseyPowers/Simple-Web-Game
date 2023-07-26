import React from "react";
import { Stack, Divider } from "@mui/material";

import allGameStates from "../games/all_states";

import { GameStatuses } from "../type";
import { selectGameID, selectGameStatus } from "../utils";
import { useAppSelector } from "../../app/hooks";

import GameStateHeader from "./game_header";
import PrepView from "./prep_game_view";

function FullGameStateView() {
  const gameId = useAppSelector(selectGameID);
  const status = useAppSelector(selectGameStatus);
  const { View, Component } = (gameId && allGameStates[gameId]) || {};

  /** Component defines the full view */
  if (Component) {
    return <Component />;
  }
  if (!View) {
    throw new Error("No View or Component defined, shouldn't see this");
  }

  return (
    <Stack
      alignItems="stretch"
      divider={<Divider flexItem />}
      sx={{ height: "100%" }}
    >
      <GameStateHeader />
      {status === GameStatuses.waiting ? <PrepView /> : <View />}
    </Stack>
  );
}

export default FullGameStateView;
