# Game Rooms

## The base of the game logic is a "Room"

- Each instance of the game class represents the whole game room.
- Might need to have 2 layers for the room to be created and configured before starting the actual game.

## The room will keep track of players, chat, and metadata for the game to play.

> players, player (online) status, and chat is pretty straightforeword.

This will get more complicated if we want to allow people to join the room as spectators or similar. Which would mean the room would need to be aware of more nuanced status's and stay in sync with the game.
(we will likely need to do similar anyway, could use the player list to show statuses like which player is "judge" in a judge-prompt game)

# Game logic

Will define an abstract class for base rules, then extend for each game type.

## Game State (true state)

The raw data for the true state of the game. Will only live on the server.

## Derived States

The derived state is what is available for some subset of players to know

- Derived states are defined by 1. What subset of users can view it, 2. What information they get.
- Information in a state will be marked as "hidden" or not. (term TBD). So the base state available to everyone could define each players hand as having X cards in it, but hide the contents.
- Derived states will stack, with hidden data being replaced by the shown data.
  - Previous example would have global info player hand of X hidden cards. That players individual state would reveal what those cards have, so would override those base hidden values

## TODO:

- will see how we want to define the events between server and client
  - Send the full (derived) state to each client on any update.
    - Pro: Quick and simple setup, would only need the one event for "heres all the data"
    - Pro: Wouldn't need to worry about any validation steps that make sure the Server/Client stay in sync.
    - Con: Would send a lot of redundent data
  - Send updates with minimal representation of changes in derived states:
    - Pros: Would reduce the redundant data issue from above
    - Con: Could be computationally heavy on the BE to determine the changes and send them.
    - Con: Introduces easier possibility of client being out of sync.
  - Resend redacted actions and recalculate state on client:
    - Pros: Might be simplist solution for reducing data sent while not putting all the overhead on the server
    - Con: Would need more game state calculated on the FE, and so probably more validation/verification steps?

# Starting over (organizing of logic, not everything) thoughts

## Room and events

current structure has a room instance with functions that handle changes,
but the socket handlers logic can be pretty redundant, making it messy and complex.

### GameRoom: Layered Updaters

1. Initial Layer of udpaters devided by area of the room they handle: (chat, players, etc.)

- Creating an updater for each action: ex. add/remove player, setPlayerOffline

2. Extend all the updaters with store logic: `Retrieving from store` -> `Updating Store after change`
3. Socket handlers get copy of each updater, can add listeners for changes:

- ex. `players_update` event whenever one of the updaters that modifies the players part of store triggers a change

### Game Logic Approach

> Game Logic won't be able to do this in a flexible way like gameRoom. at least in splitting up updaters. Would need a central entrypoint to handle all the event types

- can have similar level of updaters to start if we need to
- However: will need a single entry point through the store/sockets
  - this way we can use a shared logic for how we send updates to players based on the inputed action.

#### Updater Behavior in game Logic

Simple Updater = `inputState` -> `[outputState, hasChanges]`

> Option 1: Simple Updater, onChange send new event data from old data: `inputAction` -> `outputAction`

This would be pretty simple to make, but would need to be careful about conditional side effects of the action. Would also require more game logic running on the client to interpret that action into state changes

> Option 2: Simple Updater, onChange get changes by comparing origina + final state and send minimal changes

This would keep the updaters simple to make and would handle side-effects while keeping client side logic simpler too. However could be a bit more complex to figure out after the fact. (essentailly a copy+deep equality type function)

> Option 3: Fancy Updater: calculate the output changes alongside individual changes

This would be how we get the benefits of option 2 without needing to make a catch-all handler function.

The downside being figuring out how to structure the tracked changes (they would need to be able to potentially track the change for each player)
