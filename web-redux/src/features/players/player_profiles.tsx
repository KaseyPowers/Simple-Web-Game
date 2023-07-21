import React, { useState, useMemo } from "react";

import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Switch,
  TextField,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SendIcon from "@mui/icons-material/Send";

import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  PlayerStatuses,
  addNewPlayerProfile,
  playerProfiles,
} from "./player_profiles_slice";

export function PlayerProfiles() {
  const players = useAppSelector(playerProfiles);
  const dispatch = useAppDispatch();
  const [playerToAdd, setPlayerToAdd] = useState("");
  const errorHelper = useMemo(
    () =>
      playerToAdd &&
      players.map((player) => player.name).includes(playerToAdd) &&
      `${playerToAdd} already exists`,
    [players, playerToAdd],
  );

  return (
    <Grid
      container
      direction="column"
      sx={{ height: "100%" }}
      justifyContent="space-between"
    >
      <Grid>
        <List dense>
          {players.map(({ id, name, status }) => (
            <ListItem key={id}>
              <ListItemAvatar>
                <Avatar sx={{ width: 24, height: 24 }} />
              </ListItemAvatar>
              <ListItemText id={`player-label-${id}`} primary={name} />
              {status === PlayerStatuses.playing ? (
                <PlayArrowIcon color="success" />
              ) : (
                <Switch
                  edge="end"
                  checked={status === PlayerStatuses.waiting}
                  inputProps={{
                    "aria-labelledby": `player-label-${id}`,
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>
      </Grid>
      <Grid container>
        <TextField
          label="New Player Name"
          variant="outlined"
          error={!!errorHelper}
          helperText={errorHelper || undefined}
          value={playerToAdd}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setPlayerToAdd(event.target.value);
          }}
        />
        <IconButton
          type="button"
          sx={{ p: "10px" }}
          aria-label="add-player"
          disabled={!playerToAdd || !!errorHelper}
          onClick={(even: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            if (errorHelper) {
              console.error("click event still on when button disabled");
            }
            dispatch(addNewPlayerProfile({ name: playerToAdd }));
            setPlayerToAdd("");
          }}
        >
          <SendIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
}
