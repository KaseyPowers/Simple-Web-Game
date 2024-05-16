import type { CardDeck } from "./data/cards_types";

import { DerivedDataManager, DerivedDataClass } from "../data_manager";

import { decksManager, DecksData, type DecksDataChange } from "./data/decks";
import {
  playerStateManager,
  PlayerStateData,
  type PlayerStateI,
  type PlayerStateChange,
  type PublicPlayerStateChange,
  type PublicPlayerState,
} from "./data/player_state";

import {
  roundDataManager,
  RoundData,
  type RoundDataChange,
  type PublicRoundData,
  type PublicRoundChange,
} from "./data/round_data";

interface GameStateI {
  // to track all players currently in the game
  players: string[];
  playerStates: Record<string, PlayerStateData>;
  currentRound?: RoundData;
  decks: DecksData;
}

interface GameStateChange {
  players?: string[];
  // need to accept new player states for a new playerid
  playerStates?: Record<string, PlayerStateData | PlayerStateChange>;
  // need to be able to take a round instance to use since merging a change into nothing isn't supported
  currentRound?: RoundData | RoundDataChange;
  decks?: DecksDataChange;
}

interface PublicGameStateI {
  players: string[];
  playerStates: Record<string, PublicPlayerState>;
  currentRound?: PublicRoundData;
}

interface PublicGameStateChangeI {
  players?: string[];
  playerStates?: Record<string, PublicPlayerStateChange>;
  currentRound?: PublicRoundChange;
}
interface DerivedData {
  // public type for everyone
  public: PublicGameStateI;
  // each player only gets full access to it's PlayerState so just pass that through.
  byPlayer: Record<string, PlayerStateI>;
}

interface DerivedDataChange {
  public?: PublicGameStateChangeI;
  byPlayer?: Record<string, PlayerStateChange>;
}

class GameStateManager extends DerivedDataManager<
  GameStateI,
  DerivedData,
  GameStateChange,
  DerivedDataChange
> {
  initializeData: (options: {
    players: string[];
    allCards: CardDeck;
  }) => GameStateI = ({ players, allCards }) => {
    return {
      players,
      decks: new DecksData(allCards),
      playerStates: players.reduce(
        (output, playerId) => {
          output[playerId] = new PlayerStateData();
          return output;
        },
        {} as Record<string, PlayerStateData>,
      ),
    };
  };
  // merge will mostly work for any combination, but we do want to do some checks for the playerStateData when working with the full object, so will add that after instead of complicated logic on verifying if input type is GameStateI
  protected mergeAnyData<T extends GameStateI | GameStateChange>(
    input: T,
    toMerge?: GameStateChange | T | undefined,
  ): T {
    const {
      players: inputPlayers,
      playerStates: inputPlayerStates,
      currentRound: inputCurrentRound,
      decks: inputDecks,
    } = input;
    const {
      players: mergePlayers,
      playerStates: mergePlayerStates,
      currentRound: mergeCurrentRound,
      decks: mergeDecks,
    } = toMerge ?? {};

    const output: Partial<T> = {};
    if (mergePlayers) {
      output.players = [...mergePlayers];
    } else if (inputPlayers) {
      output.players = [...inputPlayers];
    }

    // merge the objects
    if (inputPlayerStates || mergePlayerStates) {
      const allKeys = Array.from(
        new Set([
          ...Object.keys(inputPlayerStates ?? {}),
          ...Object.keys(mergePlayerStates ?? {}),
        ]),
      );
      if (allKeys.length > 0) {
        const copyStates: GameStateChange["playerStates"] = {};
        allKeys.forEach((key) => {
          const inputVal = inputPlayerStates?.[key];
          const nextVal = mergePlayerStates?.[key];

          if (nextVal) {
            // if the change is it's own playerState, use it as is
            if (nextVal instanceof PlayerStateData) {
              copyStates[key] = nextVal.copy();
            } else if (inputVal) {
              // get the change or the new values
              copyStates[key] =
                inputVal instanceof PlayerStateData
                  ? inputVal.applyChange(nextVal)
                  : playerStateManager.mergeChanges(inputVal, nextVal);
            } else {
              copyStates[key] = playerStateManager.copyChange(nextVal);
            }
          } else if (inputVal) {
            copyStates[key] =
              inputVal instanceof PlayerStateData
                ? inputVal.copy()
                : playerStateManager.copyChange(inputVal);
          } else {
            throw new Error(
              "Somehow got a key that isn't defined in either playerStates",
            );
          }
        });
        output.playerStates = copyStates;
      }
    }
    if (mergeCurrentRound) {
      if (mergeCurrentRound instanceof RoundData) {
        output.currentRound = mergeCurrentRound.copy();
      } else if (inputCurrentRound) {
        output.currentRound =
          inputCurrentRound instanceof RoundData
            ? inputCurrentRound.applyChange(mergeCurrentRound)
            : roundDataManager.mergeChanges(
                inputCurrentRound,
                mergeCurrentRound,
              );
      } else {
        output.currentRound = roundDataManager.copyChange(mergeCurrentRound);
      }
    } else if (inputCurrentRound) {
      output.currentRound =
        inputCurrentRound instanceof RoundData
          ? inputCurrentRound.copy()
          : roundDataManager.copyChange(inputCurrentRound);
    }
    if (mergeDecks) {
      if (mergeDecks instanceof DecksData) {
        output.decks = mergeDecks.copy();
      } else if (inputDecks) {
        output.decks =
          inputDecks instanceof DecksData
            ? inputDecks.applyChange(mergeDecks)
            : decksManager.mergeChanges(inputDecks, mergeDecks);
      } else {
        output.decks = decksManager.copyChange(mergeDecks);
      }
    } else if (inputDecks) {
      output.decks =
        inputDecks instanceof DecksData
          ? inputDecks.copy()
          : decksManager.copyChange(inputDecks);
    }

    return output as T;
  }
  // wrap mergeAnyData with some checks specific to GameStateI inputs
  mergeData(
    input: GameStateI,
    toMerge?: GameStateI | GameStateChange,
  ): GameStateI {
    const {
      playerStates: mergedStates,
      players,
      ...rest
    } = this.mergeAnyData(input, toMerge);

    // the merge is based on the playerStates data only, but gameState should only have records for the players in the state;
    const playerStates: GameStateI["playerStates"] = {};
    players.forEach((id) => {
      playerStates[id] = mergedStates[id] ?? new PlayerStateData();
    });
    return {
      ...rest,
      players,
      playerStates,
    };
  }

  copy: (input: GameStateI) => GameStateI = (input) => this.mergeData(input);
  merge: (input: GameStateI, toMerge: GameStateI) => GameStateI = (
    input,
    toMerge,
  ) => this.mergeData(input, toMerge);
  mergeWithChange: (input: GameStateI, toMerge: GameStateChange) => GameStateI =
    (input, toMerge) => this.mergeData(input, toMerge);

  toDerived(input: GameStateI): DerivedData {
    const { players, playerStates, currentRound } = input;
    const publicPlayerStates: Record<string, PublicPlayerState> = {};
    const derivedPlayerStates: Record<string, PlayerStateI> = {};

    players.forEach((id) => {
      const playerData = playerStates[id];
      if (typeof playerData === "undefined") {
        throw new Error(
          "Invalid game state, there should be a playerState record for each player",
        );
      }
      const { publicData, playerOnly } = playerData.getDerivedData();
      publicPlayerStates[id] = publicData;
      derivedPlayerStates[id] = playerOnly;
    });

    const publicStateObj: PublicGameStateI = {
      players: [...players],
      playerStates: publicPlayerStates,
    };
    if (currentRound) {
      publicStateObj.currentRound = currentRound.getDerivedData();
    }
    return {
      public: publicStateObj,
      byPlayer: derivedPlayerStates,
    };
  }

  mergePublicStateChange(
    first: PublicGameStateChangeI,
    second?: PublicGameStateChangeI,
  ): PublicGameStateChangeI {
    const output: PublicGameStateChangeI = {};

    if (second?.players) {
      output.players = [...second.players];
    } else if (first.players) {
      output.players = [...first.players];
    }
    if (first.currentRound) {
      if (second?.currentRound) {
        output.currentRound = roundDataManager.mergeDerivedChange(
          first.currentRound,
          second.currentRound,
        );
      } else {
        output.currentRound = roundDataManager.copyDerivedChange(
          first.currentRound,
        );
      }
    } else if (second?.currentRound) {
      output.currentRound = roundDataManager.copyDerivedChange(
        second.currentRound,
      );
    }

    if (second?.currentRound) {
      output.currentRound;
    }

    return output;
  }

  mergeDerivedChange(
    input: DerivedDataChange,
    toMerge: DerivedDataChange,
  ): DerivedDataChange {
    const output: DerivedDataChange = {};

    if (input.public) {
      output.public = this.mergePublicStateChange(input.public, toMerge.public);
    } else if (toMerge.public) {
      output.public = this.mergePublicStateChange(toMerge.public);
    }

    const allPlayerKeys = Array.from(
      new Set([
        ...(input.byPlayer ? Object.keys(input.byPlayer) : []),
        ...(toMerge.byPlayer ? Object.keys(toMerge.byPlayer) : []),
      ]),
    );

    if (allPlayerKeys.length > 0) {
      const mergedByPlayer: DerivedDataChange["byPlayer"] = {};
      allPlayerKeys.forEach((key) => {
        const inputVal = input.byPlayer?.[key];
        const mergeVal = toMerge.byPlayer?.[key];
        if (inputVal) {
          if (mergeVal) {
            mergedByPlayer[key] = playerStateManager.mergeChanges(
              inputVal,
              mergeVal,
            );
          } else {
            mergedByPlayer[key] = playerStateManager.copyChange(inputVal);
          }
        } else if (mergeVal) {
          mergedByPlayer[key] = playerStateManager.copyChange(mergeVal);
        }
      });
      output.byPlayer = mergedByPlayer;
    }
    return output;
  }

  toDerivedChange(
    input: GameStateChange,
    changeFrom: GameStateI,
  ): DerivedDataChange {
    const output: DerivedDataChange = {};
    const publicChangeObj: PublicGameStateChangeI = {};
    if (input.players) {
      publicChangeObj.players = [...input.players];
    }

    if (input.currentRound) {
      if (input.currentRound instanceof RoundData) {
        publicChangeObj.currentRound = input.currentRound.getDerivedData();
      } else {
        const previousRound = changeFrom.currentRound;
        if (!previousRound) {
          throw new Error(
            "Can't use a change object for currentRound when previous state didn't have round data  ",
          );
        }
        publicChangeObj.currentRound = previousRound.getDerivedDataChange(
          input.currentRound,
        );
      }
    }
    const publicPlayerStates: Record<string, PublicPlayerStateChange> = {};
    const derivedPlayerStates: Record<string, PlayerStateChange> = {};

    if (input.playerStates) {
      Object.keys(input.playerStates).forEach((id) => {
        const playerVal = input.playerStates?.[id];
        if (playerVal instanceof PlayerStateData) {
          const { publicData, playerOnly } = playerStateManager.toDerived(
            playerVal.getData(),
          );
          publicPlayerStates[id] = publicData;
          derivedPlayerStates[id] = playerOnly;
        } else if (playerVal) {
          const { publicData, playerOnly } =
            playerStateManager.toDerivedChange(playerVal);
          if (publicData) {
            publicPlayerStates[id] = publicData;
          }
          if (playerOnly) {
            derivedPlayerStates[id] = playerOnly;
          }
        }
      });
    }

    if (Object.keys(publicPlayerStates).length > 0) {
      publicChangeObj.playerStates = publicPlayerStates;
    }
    if (Object.keys(publicChangeObj).length > 0) {
      output.public = publicChangeObj;
    }
    if (Object.keys(derivedPlayerStates).length > 0) {
      output.byPlayer = derivedPlayerStates;
    }

    return output;
  }
}

export const gameStateManager = new GameStateManager();

export class GameStateData extends DerivedDataClass<
  GameStateI,
  DerivedData,
  GameStateChange,
  DerivedDataChange,
  GameStateManager
> {
  constructor(
    input: GameStateI | Parameters<GameStateManager["initializeData"]>[0],
  ) {
    let inputData: GameStateI;
    if ("allCards" in input) {
      inputData = gameStateManager.initializeData(input);
    } else {
      inputData = input;
    }
    super(gameStateManager, inputData);
  }
}
