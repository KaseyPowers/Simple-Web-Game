# Notes

This will try to be generic to play many different types of games.
Will try to keep base logic open to do many different types, with simple set of functions to define for each game.

Limits:

- Will play rounds of turn based games.
  - Start with games that have players go in order (Player A then B, then C)
  - Should also be able to do a similar thing where we wait for all/some players to do an action before resolving. (ex. cards against humanity)
- Stick with card based games to start, but could get fancier later if we wanted.

## Redux Store:

- Players: just the players in/waiting/watching game
  - player will have id, name, status (watching, playing, waiting)
- GameOverview: This is basic info about the game seperate from the actual state
  - phase: string enum for basic status like "waiting", "ready", "playing", "complete"
  - players?: playerIds of players queued to play
    - Note: could just let this auto-fill to desired amount from the above players
- Game: The state of the gameplay
  - common state steps:
    - players: players in the game, order here will matter.
      - Default order: shuffle the order at start of the game
    - round: Num round count (to keep track of which round of turns we are on)
  - <...rest of state based on game played>
