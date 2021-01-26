# Ideas

## Main Structures

### Game State (true state)

- Object will full state of game at any given point
- Source of truth at any given point

### Derived States

#### Common State(s?)

- Calculated state of common information all players can see
- Example the face up cards in texas-hold-em or if players have placed their cards/bets without it saying what cards are placed from the true state
- Could have multiple Common states for 2 rooms and a zoom (one for each room?)

#### Player State

- The individual state object for each player, with the information known only to them
- ex. what cards are in hand, whatnot

## Event Based updates

- Main state will listen for updates from players or other actors and update as needed
- Common and Player states will recalculate and push updates back out if changed

### onAction({ action, source, ...details})

- event function for game state updates, can determine if action is valid and update if so
- TODO: see if webhooks can error if invalid action otherwise will need a way to let the source know action failed?

### onUpdate({ changes, other info? })

- listener will get updates needed to keep it's state up to date (will test with sending full object every time but could limit it to the changed fields to lower payload size if we feel the need and are comfortable with it)
- will need to make sure we know the details of who it sends to to determine what values to send each time (a discord bot could receive full info or a custom player-like state and we obviously don't want to send a player the wrong persons cards or whatnot)
