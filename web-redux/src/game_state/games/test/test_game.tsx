import React, { useCallback, useMemo } from "react";

import Grid from "@mui/material/Unstable_Grid2";
import { Paper, List, ListItem, ListItemText } from "@mui/material";

import { useAppSelector } from "../../../app/hooks";
import {PlayerGameStateProfile, PromptPlayerState} from "../../../game_definition";

import {gamePlayersSelector} from "./selectors";


type PromptPlayerStateProfile = PlayerGameStateProfile<PromptPlayerState>;

const PlayerListItem = ({player, isLast = true}: {player: PromptPlayerStateProfile, isLast: boolean}) => {
  const {id, name, state} = player;
  const {wonHands} = state;

  return (
    <ListItem key={id} divider={!isLast}>
      <ListItemText primary={name} />
      <ListItemText sx={{textAlign: "right"}} secondary={`score ${wonHands.length}`}/>
    </ListItem>
  )
}

const AllPlayersList = () => {
  const gamePlayers = useAppSelector(gamePlayersSelector) as PromptPlayerStateProfile[];

  return (<List dense>
        {gamePlayers.map((player, index) => (
          <PlayerListItem player={player} isLast={index + 1 >= gamePlayers.length} />
        ))}
      </List>);
}

const TestGameView = () => {
  /**
   * Default player profiles to display
   * In fancier games, would mix with game state for things like score
   */
  const gamePlayers = useAppSelector(gamePlayersSelector);

  const defaultColumnCount = useMemo(() => Math.min(4, gamePlayers.length + 1), [gamePlayers.length]);

  const getColumnProps = useCallback((size : number = 1) => {
    const getSize = (x: number) => Math.min(12, Math.floor(x * size));
    return {
      xs: 12,
      sm: getSize(6),
      md: getSize(12 / defaultColumnCount)
    };
  }, [defaultColumnCount])


  return (
    <Grid container spacing={2}>
      <Grid {...getColumnProps()}><Paper><AllPlayersList/></Paper></Grid>
      {gamePlayers.map((player) => {
        /** TODO: proper player view component */
        return (
          <Grid {...getColumnProps(2)} key={player.id}>
            <Paper>
              <div>{`${player.name}'s view`}</div>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default TestGameView;
