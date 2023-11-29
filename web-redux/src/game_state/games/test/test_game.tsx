import React, { useCallback, useMemo, useState } from "react";

import Grid from "@mui/material/Unstable_Grid2";
import { Paper } from "@mui/material";

import { useAppSelector } from "../../../app/hooks";
import { AnswerCard } from "../../../game_definition";

import { derivedPlayerStateSelector, roundStateSelector } from "./selectors";

import AllPlayersList from "./components/all_player_list";
import DisplayCard from "./components/display_card";

import type { DerivedPromptPlayerState } from "./types";

const PlayerView = ({ player }: { player: DerivedPromptPlayerState }) => {
  const round = useAppSelector(roundStateSelector);

  const [selectedCards, setSelectedCards] = useState<AnswerCard[]>([]);

  const promptLength = useMemo(() => {
    return (round.prompt.value as Array<string | false>).filter(val => val === false).length
  }, [round.prompt.value]);

  const onCardClick = useCallback((clickedCard: AnswerCard) => {
    setSelectedCards(current => {
      if (promptLength === 1) {
        return [clickedCard];
      }
      if (current.includes(clickedCard)) {
        return current.filter(card => card !== clickedCard);
      }
      return [...current, clickedCard];
    });
  }, [setSelectedCards, promptLength]);

  return (
    <>
      <Grid container spacing={2} justifyContent="space-between" m={0} mb={2}>
        <span>{`${player.name}'s view`}</span>
        <span style={{ textAlign: "right" }}>
          is judge?: {player.derived.isJudge ? "Yes" : "No"}
        </span>
      </Grid>
      
      <Grid container margin={2} spacing={2} >
        <Grid xs={4} display="flex" justifyContent="stretch"><DisplayCard card={round.prompt} answerCards={selectedCards} answerType="preview"/></Grid>
        {player.state.hand.length <= 0 ? (
          "No Hand to show"
        ) : (
            player.state.hand.map((answerCard) => {
              return <Grid key={answerCard.id} xs={4} display="flex" justifyContent="stretch"><DisplayCard card={answerCard} onClick={() => onCardClick(answerCard)}/></Grid>
            })
        )}        
      </Grid>
    </>
  );
};

const TestGameView = () => {
  /**
   * Default player profiles to display
   * In fancier games, would mix with game state for things like score
   */
  const gamePlayers = useAppSelector(derivedPlayerStateSelector);

  const defaultColumnCount = useMemo(
    () => Math.min(4, gamePlayers.length + 1),
    [gamePlayers.length],
  );

  const getColumnProps = useCallback(
    (size: number = 1) => {
      const getSize = (x: number) => Math.min(12, Math.floor(x * size));
      return {
        xs: 12,
        sm: getSize(6),
        md: getSize(12 / defaultColumnCount),
      };
    },
    [defaultColumnCount],
  );

  return (
    <Grid container spacing={2}>
      <Grid {...getColumnProps()}>
        <Paper>
          <AllPlayersList />
        </Paper>
      </Grid>
      {gamePlayers.map((player) => {
        /** TODO: proper player view component */
        return (
          <Grid {...getColumnProps(2)} key={player.id}>
            <Paper sx={{padding: 2}}>
              <PlayerView player={player} />
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default TestGameView;
