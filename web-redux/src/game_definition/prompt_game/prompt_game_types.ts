import { UUID, ObjectValues } from "../../utils";
import { BaseGameStateDefinition, BaseGameState, BaseCardType, MultiDeck } from "../base_logic";

/** Card Definitions */
export const CardTypeKeys = {
    PROMPT: "prompt",
    ANSWER: "answer"
} as const;

export type CardTypeKeyTypes = ObjectValues<typeof CardTypeKeys>;

export interface Card extends BaseCardType {
    type: CardTypeKeyTypes
}

/** Generic PromptGame concept doesn't care about value and other keys, to allow for flexibility */
export interface PromptCard extends Card {
    type: typeof CardTypeKeys.PROMPT,
    value: any
}

export interface AnswerCard extends Card {
    type: typeof CardTypeKeys.ANSWER,
    value: any
}

export interface PromptDeckType extends MultiDeck {
    [CardTypeKeys.ANSWER]: AnswerCard[],
    [CardTypeKeys.PROMPT]: PromptCard[]
}

export interface PromptPlayerState {
    /** Winning a hand gives you the winning card (and the answers used), for tracking score and viewing winning combinations */
    wonHands: Array<[PromptCard, AnswerCard[]]>,
    /** Track the current cards in the hand */
    hand: AnswerCard[]
}

/** Game State Definition Parts */
export interface PromptGameState extends BaseGameState {
    playerStates: Record<UUID, PromptPlayerState>,
    deck: PromptDeckType,
    discardPile: PromptDeckType,
    /** Round fields, information to track for each round */
    round: {
         /** the current_judge stores the index in the players array for reference and easier incrementing */
        currentJudge: number,
        /** Each round defined by the prompt card that each player submits an answer for */
        prompt: PromptCard,
        /** Track all the players submissions, game state knows who's is who's, but will not show that to the judge */
        playersCards: Record<UUID, AnswerCard[]>
    }
}

type PromptGameMetaDefinition = BaseGameStateDefinition["meta"] & {
    minHandSize: number,
    allCards: PromptDeckType
}

/** Combined Game State Definition */
export interface PromptGameStateDefinition extends BaseGameStateDefinition {
    state: PromptGameState,
    meta: PromptGameMetaDefinition
}