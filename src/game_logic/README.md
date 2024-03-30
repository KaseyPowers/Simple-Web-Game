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

first let's devide the socket handlers and core structures:

- socket handlers will handle as little as possible, only handling aspects specific to the socket and calling structured events
- structure will have the main logic for everything
  - how to connect the logic between structures?

lets devide the core structure like this:

- Full room contexts:
  - Track creating and closing rooms
- Track aspects of a room seperately
  - Players (and status)
  - Chat
  - GameState
  - etc.
