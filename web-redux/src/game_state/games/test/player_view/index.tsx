import { Stack, Divider, Typography } from "@mui/material";
import type { DerivedPromptPlayerState } from "../types";
import { PlayerViewMain } from "./player_view";
import JudgeView from "./judge_view";

/** Temp wrapper displaying a Header while displaying all players side-by-side */
const PlayerViewWrapper = ({
  player,
}: {
  player: DerivedPromptPlayerState;
}) => (
  <Stack spacing={1} divider={<Divider />}>
    <Typography variant="h5">{`${player.name}'s view`}</Typography>
    <PlayerView player={player} />
  </Stack>
);

const PlayerView = ({ player }: { player: DerivedPromptPlayerState }) =>
  player.derived.isJudge ? (
    <JudgeView player={player} />
  ) : (
    <PlayerViewMain player={player} />
  );

export default PlayerViewWrapper;
