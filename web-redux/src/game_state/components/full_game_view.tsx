import React from "react";
import { Stack, Divider } from "@mui/material";

import { selectGameStateObj } from "../games/all_states";

import { GameStatuses } from "../type";
import { selectGameStatus } from "../utils";
import { useAppSelector } from "../../app/hooks";

import GameStateHeader from "./game_header";
import PrepView from "./prep_game_view";

function FullGameStateView() {
  const status = useAppSelector(selectGameStatus);
  const { View, Component } = useAppSelector(selectGameStateObj) || {};

  /** Component defines the full view */
  if (Component) {
    return <Component />;
  }
  if (!View) {
    throw new Error("No View or Component defined, shouldn't see this");
  }

  let body = null;
  switch (status) {
    case GameStatuses.playing:
      /** TODO: Round 0 start type view */
      body = <View.Playing />;
      break;
    case GameStatuses.waiting:
      body = View.Prep ? <View.Prep /> : <PrepView />;
      break;
    case GameStatuses.finished:
      body = View.Finished ? <View.Finished /> : <div>Finished Default?</div>;
      break;
  }

  return (
    <Stack
      alignItems="stretch"
      divider={<Divider flexItem />}
      sx={{ height: "100%" }}
      spacing={2}
    >
      <GameStateHeader />
      {body}
    </Stack>
  );
}

export default FullGameStateView;
