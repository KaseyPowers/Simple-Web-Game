import { shuffle } from "~/utils/shuffle";
import {
  PromptCard,
  AnswerCard,
  CardDeck,
  CARD_TYPES,
  CardByType,
  CardGameMetaDataI,
} from "./game_types";
import { DecksData } from "./data/decks";
import { PlayerStateData } from "./data/player_state";
import { RoundData } from "./data/turn_data";

interface GameState {
  // to track all players currently in the game
  players: string[];
  playerStates: Record<string, PlayerStateData>;
  currentRound: RoundData;
  decks: DecksData;
}

class PromptGame {
  // static meta fields for a game
  static meta: Readonly<CardGameMetaDataI> = {
    minPlayers: 2,

    minHandSize: 5,

    allCards: {
      [CARD_TYPES.ANSWER]: [],
      [CARD_TYPES.PROMPT]: [],
    },
  };

  createState(players: string[]): GameState {
    const initDecks = DecksData.createDecks(PromptGame.meta.allCards);

    const [prompt, changes] = initDecks.drawCard(CARD_TYPES.PROMPT);

    const decks = initDecks.applyChanges(changes);

    return {
      players,
      playerStates: players.reduce(
        (output, id) => {
          output[id] = PlayerStateData.newPlayerState();
          return output;
        },
        {} as Record<string, PlayerStateData>,
      ),
      decks,
      currentRound: RoundData.createRoundData(prompt, players),
    };
  }

  // to connect to the room this game is instanciated in
  state: GameState;

  constructor(
    public readonly roomId: string,
    players: string[],
  ) {
    this.state = this.createState(players);
  }
}
