import { UUID, BaseUUIDItem, ObjectValues } from "../../../utils";
import { BaseGameState, DeckType } from "../../type";

export const CardTypeKeys = {
    PROMPT: "prompt",
    ANSWER: "answer"
} as const;

type CardTypeKeyTypes = ObjectValues<typeof CardTypeKeys>;

export interface Card extends BaseUUIDItem {
    type: CardTypeKeyTypes
}

/** prompts will be defined as an array of text or false. with false representing empty fields needing to be filled by an answer value */
export interface PromptCard extends Card {
    type: typeof CardTypeKeys.PROMPT,
    value: Array<string | false>
}

export interface AnswerCard extends Card {
    type: typeof CardTypeKeys.ANSWER,
    value: string
}

type TextGameDeck = DeckType<Card, CardTypeKeyTypes>;

export interface TextGamePlayerState {
    /** Winning a hand gives you the winning card (and the answers used), for tracking score and viewing winning combinations */
    won_hands: Array<[PromptCard, AnswerCard[]]>,
    /** Track the current cards in the hand */
    hand: AnswerCard[]
}

export interface TextGameState extends BaseGameState<TextGamePlayerState, TextGameDeck> {
    currentJudge?: UUID,
}