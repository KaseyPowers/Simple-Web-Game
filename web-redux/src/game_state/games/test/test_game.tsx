import React, { useMemo } from "react";

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

  const useColumnsProps = useMemo(() => {
    const useDefaultColumnCount = Math.min(4, gamePlayers.length + 1);
    return {
      xs: 12, // default on small to full width
      sm: 6, // next size up 2 columns
      md: Math.floor(12 / useDefaultColumnCount), // on full width, go to largest size available
    };
  }, [gamePlayers.length]);

  return (
    <Grid container spacing={2}>
      <Grid {...useColumnsProps}>{playerListCard}</Grid>
      {gamePlayers.map((player) => {
        /** TODO: proper player view component */
        return (
          <Grid {...useColumnsProps} key={player.id}>
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
