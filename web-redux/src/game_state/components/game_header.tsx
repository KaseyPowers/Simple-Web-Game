import React, { useMemo } from "react";
import {
  Stack,
  Button,
  ButtonGroup,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList,
  MenuItem,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import {allGames} from "../games/all_games";

import { useAppSelector, useAppDispatch } from "../../app/hooks";

import { gameSelectorSlice } from "../games_slice";

import {selectedGameIdSelector, selectedGameNameSelector, gameIdOptionsSelector} from "../selectors";

import {resetGameAction} from "../games/utils";

const {setSelectedGame} = gameSelectorSlice.actions;

function GameStateHeader() {
  const dispatch = useAppDispatch();

  const gameId = useAppSelector(selectedGameIdSelector);
  const gameName = useAppSelector(selectedGameNameSelector);
  const gameOptionIds = useAppSelector(gameIdOptionsSelector);

  const gameOptions = useMemo(() => {
    return gameOptionIds.map((id) => ({
      id,
      name: allGames[id].name,
      selected: id === gameId,
    }));
  }, [gameOptionIds, gameId]);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event: Event) => {
    setAnchorEl(null);
  };

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <h1>Name: {gameName}</h1>

      <ButtonGroup variant="contained" aria-label="split button">
        <Button onClick={() => dispatch(resetGameAction({keepPlaying: false}))}>Quit</Button>
        <Button onClick={() => dispatch(resetGameAction({keepPlaying: true}))}>Restart</Button>
        <Button
          size="small"
          aria-controls={open ? "split-button-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-label="select game"
          aria-haspopup="menu"
          onClick={handleOpen}
        >
          Change Game <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorEl}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {gameOptions.map(({ id, name, selected }) => (
                    <MenuItem
                      key={id}
                      disabled={selected}
                      selected={selected}
                      onClick={() => {
                        dispatch(setSelectedGame(id));
                      }}
                    >
                      {name}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Stack>
  );
}

export default GameStateHeader;
