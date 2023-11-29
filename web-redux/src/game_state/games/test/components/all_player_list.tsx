import React from "react";

import { List, ListItem, ListItemText } from "@mui/material";

import { useAppSelector } from "../../../../app/hooks";
import {PlayerGameStateProfile, PromptPlayerState} from "../../../../game_definition";

import {gamePlayersSelector} from "../selectors";


type PromptPlayerStateProfile = PlayerGameStateProfile<PromptPlayerState>;

const PlayerListItem = ({player, isLast = true}: {player: PromptPlayerStateProfile, isLast: boolean}) => {
  const {name, state } = player;
  const {wonHands = []} = state || {};

  return (
    <ListItem divider={!isLast}>
      <ListItemText primary={name} />
      <ListItemText sx={{textAlign: "right"}} secondary={`score ${wonHands.length}`}/>
    </ListItem>
  )
}

const AllPlayersList = () => {    
  const gamePlayers = useAppSelector(gamePlayersSelector) as PromptPlayerStateProfile[];

  return (<List dense>
        {gamePlayers.map((player, index) => (
          <PlayerListItem player={player} isLast={index + 1 >= gamePlayers.length} key={player.id}/>
        ))}
      </List>);
}

export default AllPlayersList;