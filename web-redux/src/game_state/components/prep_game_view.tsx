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
} from "@mui/material";

import CheckIcon from "@mui/icons-material/Check";
import BlockIcon from "@mui/icons-material/Block";

import { selectWaitingPlayers } from "../../features/players/player_profiles_slice";

import { selectGameMeta } from "../utils";
import { useAppSelector } from "../../app/hooks";

function PrepView() {
  const waitingPlayers = useAppSelector(selectWaitingPlayers);
  const { minPlayers, maxPlayers } = useAppSelector(selectGameMeta);

  const { listItems, stateIndicator } = useMemo(() => {
    const waitingPlayersCount = waitingPlayers.length;
    // have length of list be minimum the minPlayers count
    const listLength =
      Math.max(maxPlayers, 0) + (waitingPlayers.length > maxPlayers ? 1 : 0);

    /** Default to failed waiting */
    let stateIndicator = (
      <CircularProgress
        color={waitingPlayers.length >= minPlayers ? "success" : "error"}
      />
    );

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
        /** state indicator is failure, too many players */
        stateIndicator = <BlockIcon color="error" />;
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

        // /** If not the first or last item, check for dividers */
        // if (i > 0 && i < listLength) {
        //   if (i === minPlayers) {
        //     listItems.push(<Divider key="min-players-divider" />);
        //   } else if (i === maxPlayers) {
        //     listItems.push(<Divider key="max-players-divider" />);
        //   }
        // }
      }
    }
    return {
      listItems,
      stateIndicator,
    };
  }, [minPlayers, maxPlayers, waitingPlayers]);

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
            {stateIndicator}
          </Stack>
          <Divider variant="middle" />
          <List>{listItems}</List>
        </CardContent>
      </Card>
    </Box>
  );

  //   return (
  //     <Stack
  //       direction="row"
  //       justifyContent="space-around"
  //       alignItems="center"
  //       spacing={2}
  //       flexGrow={1}
  //     >
  //       {stateIndicator}
  //       <Paper>
  //         <List>{listItems}</List>
  //       </Paper>
  //     </Stack>
  //   );
}

export default PrepView;
