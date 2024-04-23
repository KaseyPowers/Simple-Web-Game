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

class GameState extends DataClass<GameState> {}
