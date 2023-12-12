import React, { useCallback, useMemo, useState, useEffect } from "react";

import Grid from "@mui/material/Unstable_Grid2";
import type { GridSize } from "@mui/material";
import { Stack, Divider, Button } from "@mui/material";

import { useAppSelector, useAppDispatch } from "../../../../app/hooks";
import { AnswerCard } from "../../../../game_definition";

import { roundStateSelector } from "../selectors";

import DisplayCard from "./display_card";
import RoundOverview from "./round_overview";

import { submitAnswers } from "../test_slice";

import type { DerivedPromptPlayerState } from "../types";

const playerViewColumns: Record<"xs", GridSize | true> = {
  xs: "auto",
};

/** This player view will display assuming a players view on their own, for a future state where each player's view is displayed to their respective devices.  */
export const PlayerViewMain = ({
  player,
}: {
  player: DerivedPromptPlayerState;
}) => {
  const round = useAppSelector(roundStateSelector);
  const dispatch = useAppDispatch();

  const [selectedCards, setSelectedCards] = useState<AnswerCard[]>([]);

  useEffect(() => {
    if (player.derived.hasSubmitted) {
      setSelectedCards([]);
    }
  }, [player.derived.hasSubmitted, setSelectedCards]);

  const promptLength = useMemo(() => {
    return (round.prompt.value as Array<string | false>).filter(
      (val) => typeof val !== "string",
    ).length;
  }, [round.prompt.value]);

  const onCardClick = useCallback(
    (clickedCard: AnswerCard) => {
      setSelectedCards((current) => {
        if (promptLength === 1) {
          return [clickedCard];
        }
        if (current.includes(clickedCard)) {
          return current.filter((card) => card !== clickedCard);
        }
        return [...current, clickedCard];
      });
    },
    [setSelectedCards, promptLength],
  );

  const canSubmit = useMemo(() => {
    return selectedCards.length === promptLength;
  }, [selectedCards.length, promptLength]);

  return (
    <Stack
      direction={"row"}
      spacing={2}
      divider={<Divider orientation="vertical" flexItem />}
    >
      <RoundOverview answerCards={selectedCards}>
        {!player.derived.hasSubmitted && (
          <Button
            variant="contained"
            disabled={!canSubmit}
            onClick={() =>
              dispatch(submitAnswers({ id: player.id, answers: selectedCards }))
            }
          >
            Submit
          </Button>
        )}
      </RoundOverview>
      <Grid container margin={2} spacing={2}>
        {player.state.hand.length <= 0
          ? "No Hand to show"
          : player.state.hand.map((answerCard) => {
              let selected: boolean | number =
                selectedCards.indexOf(answerCard);
              if (selected < 0) {
                selected = false;
              } else if (promptLength < 2) {
                selected = true;
              } else {
                // shift to make it 1-indexed instead of 0-indexed
                selected += 1;
              }

              return (
                <Grid
                  key={answerCard.id}
                  {...playerViewColumns}
                  display="flex"
                  justifyContent="stretch"
                  maxWidth="50%"
                >
                  <DisplayCard
                    card={answerCard}
                    onClick={() => onCardClick(answerCard)}
                    selected={selected}
                  />
                </Grid>
              );
            })}
      </Grid>
    </Stack>
  );
};
