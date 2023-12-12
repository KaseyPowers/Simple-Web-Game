import React, { useMemo } from "react";

import { Paper, Stack, Box } from "@mui/material";

import { useAppSelector } from "../../../../app/hooks";
import { AnswerCard } from "../../../../game_definition";

import { gamePlayerIds, roundStateSelector } from "../selectors";

import AllPlayersList from "./all_player_list";
import DisplayCard from "./display_card";

const RoundOverview = ({
  answerCards,
  children,
}: {
  answerCards?: AnswerCard[];
  children?: React.ReactNode;
}) => {
  const { prompt, currentJudge, playersCards } =
    useAppSelector(roundStateSelector);
  const playerIds = useAppSelector(gamePlayerIds);

  const { submittedCount, waitingCount } = useMemo(() => {
    let waitingCount = playerIds.length;
    let submittedCount = 0;

    playerIds.forEach((id, index) => {
      if (index === currentJudge) {
        waitingCount -= 1;
      } else if ((playersCards[id] || []).length > 0) {
        submittedCount += 1;
        waitingCount -= 1;
      }
    });

    return {
      waitingCount,
      submittedCount,
    };
  }, [playerIds, playersCards, currentJudge]);

  return (
    <Stack spacing={2}>
      <Paper>
        <AllPlayersList />
      </Paper>
      <Box display="flex" justifyContent="stretch" maxWidth="fit-content">
        <DisplayCard
          card={prompt}
          answerCards={answerCards}
          answerType="preview"
        />
      </Box>
      <div>
        <strong>Submitted: </strong> {submittedCount}
        <br />
        <strong>Remaining: </strong> {waitingCount}
      </div>
      {children}
    </Stack>
  );
};

export default RoundOverview;
