/**
 * Creating an initial game class here:
 * Some aspects are trying to plan ahead for iterations where we make this base class more and more generic/flexible.
 * To start will make this specific to the game type in mind though, and go from there
 */

import { CARD_TYPES } from "./game_types";

import type GameRoom from "../game_room/room";
// importing types seperately so I don't need to use `type` for all but one item
import type {
  MetaDataI,
  GameStateI,
  PlayerStateI,
  CardDeck,
  CardMultiDeck,
  DerivedType,
  DerivedObjType,
  CardType,
  PromptCard,
  AnswerCard,
  TurnDataI,
} from "./game_types";

import { hiddenDeck, hiddenMultiDeck } from "./utils";

/**
 * Define the logic and structure for the (server-side) game logic:
 *
 * TODO:
 * - how will we track the updates to the players in the game.
 */
export default class Game {
  private readonly Room: GameRoom;
  // metadata for the game
  readonly meta: MetaDataI;
  // the full game state data
  gameState: GameStateI;
  /**
   * define all of the groups defined in the game for derived data sets.
   * By default there is one group `public` and each playerId has a `private` group for just them.
   * Here we can define any other groups.
   *
   * How we define the groups will be TBD as we see what they look like.
   */
  groupDefinitions = {};
  derivedStates: Record<string, DerivedType<GameStateI>> = {};

  // return all the playerIds in the game
  // TODO: Figure out where we are getting this info
  get playerIds() {
    // right now returning keys of gameState, but not a good long term solution
    return Object.keys(this.gameState.playerStates);
  }

  private publicHiddenAllPlayerStates(): DerivedObjType<
    GameStateI["playerStates"]
  > {
    return this.playerIds.reduce((output, userId) => {
      output[userId] = this.publicHiddenPlayerState(userId);
      return output;
    }, {});
  }

  private publicHiddenPlayerState(userId: string): DerivedType<PlayerStateI> {
    const playerState = this.gameState.playerStates[userId];
    // should still be a valid userID
    if (!playerState) {
      throw new Error(`No player state found for user id: ${userId}`);
    }
    // hidden state will keep won_hands logic, and will have a hand matching the right length of hidden cards
    return {
      hand: hiddenDeck(playerState.hand),
      won_hands: playerState.won_hands,
    };
  }

  private publicHiddenTurnData(): DerivedObjType<TurnDataI> {
    const {
      currentJudge,
      prompt,
      submittedAnswers,
      submittingPlayers,
      waitingPlayers,
    } = this.gameState.currentRound;

    // judge, prompt, and wich players haven't submitted is public knowledge
    const hiddenTurnData: DerivedObjType<TurnDataI> = {
      currentJudge,
      prompt,
      waitingPlayers,
    };

    // once everyone has submitted, then build the public version of the submittedAnswers
    if (waitingPlayers.length <= 0) {
      const hiddenSubmittingPlayers: string[] = [];
      const hiddenSubmittedAnswers: TurnDataI["submittedAnswers"] = {};

      submittingPlayers.forEach((playerId, index) => {
        const obfuscatedId = `shuffled_player_id_${index}`;
        // saving these ids to make it easier to grab all answers from the object?
        hiddenSubmittingPlayers.push(obfuscatedId);
        hiddenSubmittedAnswers[obfuscatedId] = submittedAnswers[playerId];
      });
      hiddenTurnData.submittingPlayers = hiddenSubmittingPlayers;
      hiddenTurnData.submittedAnswers = hiddenSubmittedAnswers;
    }

    return hiddenTurnData;
  }

  // get the full public state
  getPublicGameState(): DerivedObjType<GameStateI> {
    return {
      playerStates: this.publicHiddenAllPlayerStates(),
      deck: hiddenMultiDeck(this.gameState.deck),
      discardPile: hiddenMultiDeck(this.gameState.discardPile),
      currentRound: this.publicHiddenTurnData(),
    };
  }
  // get this players specific state
  getPlayerGameState(userId: string) {
    const playerState = this.gameState.playerStates[userId];
    // should still be a valid userID
    if (!playerState) {
      throw new Error(`No player state found for user id: ${userId}`);
    }
    return {
      playerStates: {
        [userId]: playerState,
      },
    };
  }
}
