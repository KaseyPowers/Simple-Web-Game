import React from "react";
import { Paper } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

import { Counter } from "./features/counter/Counter";
import { PlayerProfiles } from "./features/players/player_profiles";
import GameStateDisplay from "./game_state_component";

function App() {
  return (
    <Grid
      container
      disableEqualOverflow
      spacing={2}
      alignItems="stretch"
      sx={{
        height: "100vh",
        padding: 2,
        // "--Grid-borderWidth": "1px",
        // borderTop: "var(--Grid-borderWidth) solid",
        // borderLeft: "var(--Grid-borderWidth) solid",
        // borderColor: "divider",
        // "& > div": {
        //   borderRight: "var(--Grid-borderWidth) solid",
        //   borderBottom: "var(--Grid-borderWidth) solid",
        //   borderColor: "divider",
        // },
      }}
    >
      <Grid xs="auto">
        <Paper sx={{ height: "100%", p: 2 }}>
          <PlayerProfiles />
        </Paper>
      </Grid>
      <Grid xs>
        <GameStateDisplay />
        <Counter />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <span>
          <span>Learn </span>
          <a
            className="App-link"
            href="https://reactjs.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            React
          </a>
          <span>, </span>
          <a
            className="App-link"
            href="https://redux.js.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Redux
          </a>
          <span>, </span>
          <a
            className="App-link"
            href="https://redux-toolkit.js.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Redux Toolkit
          </a>
          ,<span> and </span>
          <a
            className="App-link"
            href="https://react-redux.js.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            React Redux
          </a>
        </span>
      </Grid>
    </Grid>
  );
}

export default App;
