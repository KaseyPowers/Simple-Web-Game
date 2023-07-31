import React, { useMemo } from "react";

import {
  Box,
  Card,
  Typography,
  Stack,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CardContent,
  IconButton,
} from "@mui/material";

import CheckIcon from "@mui/icons-material/Check";
import BlockIcon from "@mui/icons-material/Block";

import { selectWaitingPlayers } from "../../features/players/player_profiles_selectors";

import { selectGameMeta } from "../utils";
import { startGameAction } from "../games/utils";
import { useAppSelector, useAppDispatch } from "../../app/hooks";

function PrepView() {
  const waitingPlayers = useAppSelector(selectWaitingPlayers);
  const dispatch = useAppDispatch();
  const { minPlayers, maxPlayers } = useAppSelector(selectGameMeta);

  const waitingPlayersCount = waitingPlayers.length;

  let iconColor: React.ComponentProps<typeof IconButton>["color"] = "info";
  if (waitingPlayersCount >= minPlayers) {
    iconColor = "success";
  }
  if (waitingPlayersCount >= maxPlayers) {
    iconColor = "warning";
  }

  const readyPlayerIds = waitingPlayers
    .slice(0, maxPlayers)
    .map((player) => player.id);

  const startButton = (
    <IconButton
      color={iconColor}
      disabled={waitingPlayersCount < minPlayers}
      onClick={() => dispatch(startGameAction(readyPlayerIds))}
    >
      <CircularProgress color={iconColor} />
    </IconButton>
  );

  // const listItems = useMemo(() => {
  // const waitingPlayersCount = waitingPlayers.length;

  // have length of list be minimum the minPlayers count
  const listLength =
    Math.max(maxPlayers, 0) + (waitingPlayers.length > maxPlayers ? 1 : 0);

  let listItems = [];

  for (let i = 0; i < listLength; i += 1) {
    /** For the empty */
    if (i >= maxPlayers) {
      listItems.push(
        <ListItem key="max_players_exceeded">
          <ListItemIcon>
            <BlockIcon color="error" />
          </ListItemIcon>
          <ListItemText primary={`+${waitingPlayersCount - maxPlayers}`} />
        </ListItem>,
      );
    } else {
      /** Get player if available */
      const player = i <= waitingPlayers.length && waitingPlayers[i];
      const divider =
        i > 0 &&
        i < listLength &&
        [minPlayers, maxPlayers].some((val) => val === i + 1);
      if (player) {
        listItems.push(
          <ListItem key={player.id} divider={divider}>
            <ListItemText inset primary={player.name} />
          </ListItem>,
        );
      } else {
        listItems.push(
          <ListItem key={`empty-player-slot-${i}`} divider={divider}>
            {i < minPlayers && (
              <ListItemIcon>
                <CheckIcon color="info" />
              </ListItemIcon>
            )}
          </ListItem>,
        );
      }
    }
  }
  // return listItems;
  // }, [minPlayers, maxPlayers, waitingPlayers]);

  return (
    <Box flexGrow={1} p={4}>
      <Card>
        <CardContent>
          <Stack
            direction="row"
            spacing={4}
            m={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography gutterBottom variant="h4">
              Players Ready
            </Typography>
            {startButton}
          </Stack>
          <Divider variant="middle" />
          <List>{listItems}</List>
        </CardContent>
      </Card>
    </Box>
  );
}

export default PrepView;
