import React, { useState, useMemo } from "react";

import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import SendIcon from "@mui/icons-material/Send";

import CheckIcon from "@mui/icons-material/Check";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  PlayerStatuses,
  PlayerStatusTypes,
  addPlayer,
  setPlayerStatus,
} from "./player_profiles_slice";
import { selectPlayerProfiles } from "./player_profiles_selectors";

function PlayerStatusMenu({
  playerId,
  status,
  onChange,
}: {
  playerId: string;
  status: PlayerStatusTypes;
  onChange: (status: PlayerStatusTypes) => void;
}) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const onStatusChange = (newStatus: PlayerStatusTypes) => {
    onChange(newStatus);
    handleClose();
  };

  /**
   * Icon to use for each status:
   * watching: VisibilityIcon
   * playing: PlayArrowIcon
   * waiting: CheckIcon
   */
  let useIcon = null;
  let iconColor: React.ComponentProps<typeof IconButton>["color"] = undefined;
  switch (status) {
    case PlayerStatuses.watching:
      useIcon = <VisibilityIcon />;
      iconColor = "info";
      break;
    case PlayerStatuses.waiting:
      useIcon = <CheckIcon />;
      iconColor = "success";
      break;
    case PlayerStatuses.playing:
      useIcon = <PlayArrowIcon />;
      iconColor = "primary";
      break;
  }
  /** TODO: have the menu items contextual */
  return (
    <>
      <IconButton
        id={`${playerId}-status-button`}
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        color={iconColor}
      >
        {useIcon}
      </IconButton>
      <Menu
        id={`${playerId}-basic-menu`}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        {status !== PlayerStatuses.waiting && (
          <MenuItem onClick={() => onStatusChange(PlayerStatuses.waiting)}>
            Ready To Play
          </MenuItem>
        )}
        {status !== PlayerStatuses.watching && (
          <MenuItem onClick={() => onStatusChange(PlayerStatuses.watching)}>
            Watch
          </MenuItem>
        )}
        {status !== PlayerStatuses.playing && (
          <MenuItem onClick={() => onStatusChange(PlayerStatuses.playing)}>
            Playing
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

export function PlayerProfiles() {
  const players = useAppSelector(selectPlayerProfiles);
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
              <PlayerStatusMenu
                playerId={id}
                status={status}
                onChange={(newStatus) => {
                  dispatch(setPlayerStatus(id, newStatus));
                }}
              />
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
            dispatch(addPlayer({ name: playerToAdd }));
            setPlayerToAdd("");
          }}
        >
          <SendIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
}
