import React from "react";
import { Paper } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

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
      </Grid>
    </Grid>
  );
}

export default App;
