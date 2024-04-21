export enum CARD_TYPES {
  PROMPT = "prompt",
  ANSWER = "answer",
}

interface BaseCardI {
  id: string;
}
export interface PromptCard extends BaseCardI {
  type: CARD_TYPES.PROMPT;
  value: string[];
}
export interface AnswerCard extends BaseCardI {
  type: CARD_TYPES.ANSWER;
  value: string;
}
export type CardType = PromptCard | AnswerCard;

export interface CardByType {
  [CARD_TYPES.PROMPT]: PromptCard;
  [CARD_TYPES.ANSWER]: AnswerCard;
}

export type CardDeck = {
  [Key in CARD_TYPES]: CardByType[Key][];
};

// export interface CardDeck {
//   [CARD_TYPES.PROMPT]: CardByType[CARD_TYPES.PROMPT][];
//   [CARD_TYPES.ANSWER]: CardByType[CARD_TYPES.ANSWER][];
// }

export interface BaseMetaDataI {
  // self explanatory, all games would need to define rules for how many players they can handle
  minPlayers: number;
  // max players is optional if a game could be theoretically be played by an infinite amount of people at once
  maxPlayers?: number;
  /**
   * Fill in the game peice data and such
   */
}

export interface CardGameMetaDataI extends BaseMetaDataI {
  // card game specifics - or prompt game for initial implementation
  allCards: CardDeck;
  // used when dealing cards, will add to hand until it's length reaches this min
  minHandSize: number;
}
