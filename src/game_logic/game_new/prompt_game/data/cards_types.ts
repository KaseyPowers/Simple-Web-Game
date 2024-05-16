export const allCardTypes = {
  prompt: "PROMPT",
  answer: "ANSWER",
} as const;

type CardTypesObj = typeof allCardTypes;
export type CardTypeOptions = CardTypesObj[keyof CardTypesObj];

interface BaseCardI {
  id: string;
}

export interface PromptCard extends BaseCardI {
  type: CardTypesObj["prompt"];
  value: string[];
}
export interface AnswerCard extends BaseCardI {
  type: CardTypesObj["answer"];
  value: string;
}
export type CardType = PromptCard | AnswerCard;

export type GetCardByType<Cards extends BaseCardI & { type: string }> = {
  [T in Cards as T["type"]]: T;
};

export type CardByType = GetCardByType<CardType>;

export type CardDeck = {
  [Key in keyof CardByType]: CardByType[Key][];
};

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
