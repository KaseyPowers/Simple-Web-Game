import React, { useCallback, useMemo, useState } from "react";

import Grid from "@mui/material/Unstable_Grid2";
import type { GridSize } from "@mui/material";
import { Paper, Stack, Box, Divider } from "@mui/material";

import { useAppSelector } from "../../../../app/hooks";
import { AnswerCard } from "../../../../game_definition";

import { roundStateSelector } from "../selectors";

import AllPlayersList from "./all_player_list";
import DisplayCard from "./display_card";

import type { DerivedPromptPlayerState } from "../types";
import RoundOverview from "./round_overview";

const JudgeView = ({ player }: { player: DerivedPromptPlayerState }) => {
  return (
    <Stack
      direction={"row"}
      spacing={2}
      divider={<Divider orientation="vertical" flexItem />}
    >
      <RoundOverview />
      <div>TODO: Judge View</div>
    </Stack>
  );
};

export default JudgeView;
