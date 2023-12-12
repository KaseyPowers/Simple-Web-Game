import React, { useCallback, useMemo, useState } from "react";

import { Paper, Stack } from "@mui/material";

import { useAppSelector } from "../../../app/hooks";

import { derivedPlayerStateSelector } from "./selectors";

import PlayerView from "./player_view";

const TestGameView = () => {
  const gamePlayers = useAppSelector(derivedPlayerStateSelector);
  return (
    <Stack spacing={2}>
      {gamePlayers.map((player) => {
        /** TODO: proper player view component */
        return (
          <Paper sx={{ padding: 2 }} key={player.id}>
            <PlayerView player={player} />
          </Paper>
        );
      })}
    </Stack>
  );
};

export default TestGameView;
