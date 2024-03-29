export enum CARD_TYPES {
  PROMPT = "prompt",
  ANSWER = "answer",
}
interface CardBaseI {
  id: string;
  type: CARD_TYPES;
}
export interface PromptCard extends CardBaseI {
  type: CARD_TYPES.PROMPT;
  value: string[];
}
export interface AnswerCard extends CardBaseI {
  type: CARD_TYPES.ANSWER;
  value: string;
}
export type CardType = PromptCard | AnswerCard;
export type CardDeck<Type extends CardType = CardType> = Type[];

export interface CardMultiDeck {
  [CARD_TYPES.PROMPT]: CardDeck<PromptCard>;
  [CARD_TYPES.ANSWER]: CardDeck<AnswerCard>;
}

// Track which types we actually use in game data to make derived data stuff easier?
export type GamePrimativeTypes = CardType | number | string | boolean;

export interface MetaDataI {
  /** Min/Max amount of players allowed */
  minPlayers: number;
  maxPlayers: number;
  /**
   * Define all cards needed by the game. To copy and shuffle into decks and such
   */
  allCards: CardMultiDeck;

  // when dealing cards, will make sure a player has at least this many cards
  minHandSize: number;
}

export interface PlayerStateI {
  // current hand of cards
  hand: CardDeck<AnswerCard>;
  // track the hands won with the winning prompt+answer combination. These will be copies of the cards, will still discard all cards to keep the total cards in play consistent
  won_hands: Array<[PromptCard, AnswerCard[]]>;
}

/** Turn interface to track information about current turn (or the judge round in the Jude-Prompt style game) */
export interface TurnDataI {
  /** the current_judge stores the index in the players array for reference and easier incrementing */
  currentJudge: number;
  /** Each round defined by the prompt card that each player submits an answer for */
  prompt: PromptCard;
  /** Track all the players submissions, game state knows who's is who's, but will not show that to the judge */
  submittedAnswers: Record<string, AnswerCard[]>;
  // seperate array of playerIds that get's shuffled. then the public submittedAnswers will use the indexes of this array to obfuscate the keys
  submittingPlayers: string[];
  waitingPlayers: string[];
}

export interface GameStateI {
  playerStates: Record<string, PlayerStateI>;
  deck: CardMultiDeck;
  discardPile: CardMultiDeck;
  currentRound: TurnDataI;
}

/**
 * Type utils for converting the src type to valid derived values
 * NOTE: Initial thoughts were to pass False for "hidden" state, but if data is boolean, using undefined/null might be better
 */
export type DerivedType<T> =
  | T
  | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | (T extends Array<any>
      ? number
      : T extends undefined | GamePrimativeTypes
        ? T
        : DerivedObjType<T>);

export type DerivedObjType<Type> = {
  [Property in keyof Type]?: DerivedType<Type[Property]>;
};

export type PrimativeDerivedType = DerivedType<GamePrimativeTypes>;

export type PrimativeDerivedArrayType = DerivedType<Array<GamePrimativeTypes>>;

export type PrimativeDerivedObjType = DerivedType<
  Record<string, PrimativeDerivedType | PrimativeDerivedArrayType>
>;

export type RootDerivedTypes =
  | PrimativeDerivedType
  | PrimativeDerivedArrayType
  | PrimativeDerivedObjType;
