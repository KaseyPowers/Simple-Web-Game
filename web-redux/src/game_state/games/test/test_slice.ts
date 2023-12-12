import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

import {
  gameStateName,
  PromptGameStateDefinition,
  BaseGameDefinitionInput,
  CardTypeKeys,
  GameStatuses,
  getEmptyPromptGameState,
  getInitialPromptGameState,
  fillPromptHands,
  createNextPromptRound,
  AnswerCard,
  PromptCard,
} from "../../../game_definition";

import type { UUID } from "../../../utils";

import { resetGameAction, startGameAction } from "../utils";

export const id = "text_prompt" as const;

export type TestGameState = PromptGameStateDefinition & {
  id: typeof id;
};

const testGameInitialEmptyState: BaseGameDefinitionInput<TestGameState> = {
  id,
  name: "Test Prompt Game",
  status: GameStatuses.waiting,
  players: [],
  meta: {
    minPlayers: 3,
    maxPlayers: 8,
    allCards: {
      [CardTypeKeys.ANSWER]: [
        {
          id: "answer_1",
          value: "answer",
        },
        {
          value: "answer 2",
        },
        {
          value: "a bigger blacker answer",
        },
        {
          value: "harry potter",
        },
        {
          value: "puff the magic dragon",
        },
        {
          value: "Youths!",
        },
        {
          value: "Scmidt!",
        },
        {
          value: "I can do this all day Winston",
        },
        {
          value: "non-vegetarian cereal",
        },
        {
          value: "depends who's asking",
        },
        {
          value:
            "time traveling to the past expecting to use future knowledge to succeed but realizing you can't remember any useful details",
        },
      ].map((card) => {
        const fullCard: AnswerCard = {
          id: card.value,
          ...card,
          type: CardTypeKeys.ANSWER,
        };
        return fullCard;
      }),
      [CardTypeKeys.PROMPT]: [
        {
          id: "prompt",
          value: ["question", false],
        },
        {
          value: ["fill in the", false, "middle"],
        },
        {
          value: ["whoops! all", false],
        },
        {
          value: ["to", false, "or not to", false],
        },
      ].map((card) => {
        const fullCard: PromptCard = {
          id: card.value.filter(Boolean).join("-"),
          ...card,
          type: CardTypeKeys.PROMPT,
        };
        return fullCard;
      }),
    },
    // minHandSize: 7,
    minHandSize: 3,
  },
};
/** this inital state is empty, to save some time and not shuffle a new deck */
const testInitialGameState: TestGameState = {
  ...testGameInitialEmptyState,
  state: getEmptyPromptGameState<TestGameState>(testGameInitialEmptyState),
};

function onStart(state: TestGameState) {
  let output = {
    ...state,
    state: getInitialPromptGameState(state),
  };
  output = fillPromptHands(output);
  output = createNextPromptRound(output);
  return output;
}

export const testStateSlice = createSlice({
  name: gameStateName,
  initialState: testInitialGameState,
  reducers: {
    submitAnswers(
      state,
      action: PayloadAction<{ id: UUID; answers: AnswerCard[] }>,
    ) {
      const expectedLength = (
        state.state.round.prompt.value as Array<string | false>
      ).filter((prt) => typeof prt !== "string").length;
      if (action.payload.answers.length !== expectedLength) {
        throw new Error(
          `Expected ${expectedLength} answer cards, but submitted ${action.payload.answers.length} cards`,
        );
      }
      if (!state.players.includes(action.payload.id)) {
        throw new Error("payload player id not found in state's players");
      }
      state.state.round.playersCards[action.payload.id] =
        action.payload.answers;
      const answerIds = action.payload.answers.map((card) => card.id);
      state.state.playerStates[action.payload.id].hand =
        state.state.playerStates[action.payload.id].hand.filter(
          (card) => !answerIds.includes(card.id),
        );
      return state;
    },
  },
  extraReducers(builder) {
    builder.addCase(startGameAction, (state, action) => {
      let nextState = {
        ...state,
        status: GameStatuses.playing,
        players: action.payload,
      };
      return onStart(nextState);
    });
    builder.addCase(resetGameAction, (state, action) => {
      if (action.payload.keepPlaying && state.status !== GameStatuses.waiting) {
        return onStart(state);
      }
      return {
        ...testInitialGameState,
      };
    });
  },
});

export const { submitAnswers } = testStateSlice.actions;

export default testStateSlice;
