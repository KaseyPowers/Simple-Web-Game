import React from "react";

import Grid from "@mui/material/Unstable_Grid2";
import { Paper, List, ListItem, ListItemText } from "@mui/material";

import { useAppSelector } from "../../../app/hooks";
import { selectGamePlayers } from "../../utils";

const TestGameView = () => {
  /**
   * Default player profiles to display
   * In fancier games, would mix with game state for things like score
   */
  const gamePlayers = useAppSelector(selectGamePlayers);

  const playerListCard = (
    <Paper>
      <List dense>
        {gamePlayers.map((player, index) => (
          <ListItem key={player.id} divider={index + 1 < gamePlayers.length}>
            <ListItemText primary={player.name} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  return (
    <Grid container spacing={2}>
      <Grid xs={3}>{playerListCard}</Grid>
    </Grid>
  );
};

export default TestGameView;
