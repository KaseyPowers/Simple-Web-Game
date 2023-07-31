import React, { useState, useRef, useMemo } from "react";
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

import allGameStates, { allGameIds } from "../games/all_states";
import { id as emptyGameId } from "../games/empty";

import { selectGameName, selectGameID } from "../utils";
import { resetGame } from "../games/utils";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { setGameStateReducer } from "../../app/store";

const availableGameStates = allGameIds.filter((val) => val !== emptyGameId);

function GameStateHeader() {
  const dispatch = useAppDispatch();

  const gameId = useAppSelector(selectGameID);
  const gameName = useAppSelector(selectGameName);

  const gameOptions = useMemo(() => {
    return availableGameStates.map((id) => ({
      id,
      name: allGameStates[id].name,
      selected: id === gameId,
    }));
  }, [gameId]);

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
        <Button onClick={() => dispatch(resetGame(false))}>Quit</Button>
        <Button onClick={() => dispatch(resetGame(true))}>Restart</Button>
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
                        setGameStateReducer(id);
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
