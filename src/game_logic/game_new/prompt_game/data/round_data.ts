import { DerivedDataManager, DerivedDataClass } from "../../data_manager";

import { CARD_TYPES, type AnswerCard, type PromptCard } from "./cards_types";
import { shuffle } from "~/utils/shuffle";
import { copyCard, copyCardArr } from "./cards_utils";

// these types will always be used so seperating out to make it easier
interface CommonRoundDataI {
  /** Could track the current round, and use roundNumber % playerIds.length to get the current judge, but would get messy if player count can change during the game  */
  /** the current_judge stores the id of the current player, was originally storing a number to reference player in array of players in game, but again could get messy if dealing with players joining/leaving the game  */
  currentJudge: string;
  /** Each round defined by the prompt card that each player submits an answer for */
  prompt: PromptCard;
}

/** Turn interface to track information about current turn/round */
export interface RoundDataI extends CommonRoundDataI {
  // which players are in the current round, does not include the judge, and will be the order provided
  playersInRound: string[];
  // private mapping between the playersInRound and their key in the submittedAnswers
  submittingPlayerKeys: Record<string, string>;
  /** Track all the players submissions, game state knows who's is who's, but will not show that to the judge */
  submittedAnswers: Record<string, AnswerCard[]>;
}

type UnchangingKeys =
  | "currentJudge"
  | "playersInRound"
  | "submittingPlayerKeys";

// make sure that we don't allow changes to certain values. They can only change when creating a new round
// NOTE: Prompt sort of counts but I'm picturing an option to reject a prompt if the judge doesn't like it or any reason.
export type RoundDataChange = Partial<Omit<RoundDataI, UnchangingKeys>>;

type PublicJudgeReady = Pick<
  RoundDataI,
  "submittedAnswers" | keyof CommonRoundDataI
>;
type PublicJudgeReadyChange = Omit<Partial<PublicJudgeReady>, UnchangingKeys>;
interface PublicJudgeWaiting extends CommonRoundDataI {
  /** Reveal which players we are waiting to submit */
  waitingPlayers: string[];
  // the number of players who have submitted
  submittedAnswers: number;
}
type PublicJudgeWaitingChange = Omit<
  Partial<PublicJudgeWaiting>,
  UnchangingKeys
>;

export type PublicRoundData = PublicJudgeWaiting | PublicJudgeReady;

export type PublicRoundChange =
  | PublicJudgeWaitingChange
  | PublicJudgeReadyChange;

export class RoundDataManager extends DerivedDataManager<
  RoundDataI,
  PublicRoundData,
  RoundDataChange,
  PublicRoundChange
> {
  static submittedAnswersKey = (index: number) => `submitting_player_#${index}`;

  initializeData: (
    prompt: PromptCard,
    allPlayers: string[],
    previousJudge?: string,
  ) => RoundDataI = (prompt, allPlayers, previousJudge) => {
    // if there is a previous judge, try to find it, otherwise use -1 as if the judge wasn't found
    const currentJudgeIndex = previousJudge
      ? allPlayers.indexOf(previousJudge)
      : -1;
    const nextJudgeIndex = (currentJudgeIndex + 1) % allPlayers.length;
    const nextJudge = allPlayers[nextJudgeIndex];
    // check for undefined in case of a bug, and to make typescript happy
    if (!nextJudge) {
      throw new Error(
        "Somehow got an undefined value from the players array, this shouldn't be possible",
      );
    }
    // build the shuffled array of players to use for the next round. Starting with a copy of all players
    const playersInRound = [...allPlayers];
    // then remove the new judge's value from the array
    playersInRound.splice(nextJudgeIndex, 1);

    // shuffle the playerIds to create the random ids
    const shuffledPlayerIds = shuffle(playersInRound);

    const submittingPlayerKeys = shuffledPlayerIds.reduce(
      (output, key, index) => {
        output[key] = RoundDataManager.submittedAnswersKey(index);
        return output;
      },
      {} as Record<string, string>,
    );

    return {
      currentJudge: nextJudge,
      prompt,
      playersInRound,
      submittingPlayerKeys,
      submittedAnswers: {},
    };
  };

  // always require submittedAnswers, but allow the others to be undefined
  getWaitingPlayers(
    input: Pick<
      RoundDataI,
      "submittedAnswers" | "playersInRound" | "submittingPlayerKeys"
    >,
  ): string[] {
    // merge the current data with this to provide default values, but expect submittedAnswers to always be defined if called from a data change
    const { playersInRound, submittedAnswers, submittingPlayerKeys } = input;
    return playersInRound.filter((id) => {
      const key = submittingPlayerKeys[id];
      return !(key && submittedAnswers[key]);
    });
  }

  mergeSubmittedAnswer(
    input: RoundDataI["submittedAnswers"],
    toMerge?: RoundDataI["submittedAnswers"],
  ): RoundDataI["submittedAnswers"] {
    const output: RoundDataI["submittedAnswers"] = {};
    // if playersInRound provided, this will only iterate through those keys to create the final object.
    const allKeys = Array.from(
      new Set(...Object.keys(input), ...(toMerge ? Object.keys(toMerge) : [])),
    );

    allKeys.forEach((key) => {
      const value = toMerge?.[key] ?? input[key];
      if (!value) {
        // this will only be hit if there was no value found. but the key was from the combined set of keys, so this shouldn't happen. (aka - shouldn't be possible but if it happens I want to see why)
        throw new Error(
          "Shouldn't be able to happen, allKeys has a key that wasn't found in either set of submitted answers",
        );
      }
      output[key] = copyCardArr(value);
    });
    return output;
  }

  getSubmittedAnswersCount(input: RoundDataI["submittedAnswers"]): number {
    // to convert this object to a size, we first grab all keys, and filter out to only keep keys whose value is a not-empty array. Once done, we return the length of the valid keys array
    return Object.keys(input).filter((key) => {
      const value = input[key];
      return value && value.length > 0;
    }).length;
  }

  toDerived(input: RoundDataI): PublicRoundData {
    const { prompt, currentJudge, submittedAnswers } = input;
    const waitingPlayers = this.getWaitingPlayers(input);

    return {
      prompt,
      currentJudge,
      ...(waitingPlayers.length > 0
        ? {
            waitingPlayers,
            submittedAnswers: this.getSubmittedAnswersCount(submittedAnswers),
          }
        : {
            // use merge with no second argument to copy
            submittedAnswers: this.mergeSubmittedAnswer(submittedAnswers),
          }),
    };
  }

  toDerivedChange(
    input: RoundDataChange,
    changeFrom: RoundDataI,
  ): PublicRoundChange {
    const { prompt, submittedAnswers } = input;
    let output: PublicRoundChange = {};

    if (prompt) {
      output.prompt = prompt;
    }
    if (submittedAnswers) {
      const afterChange = this.mergeWithChange(changeFrom, input);
      const waitingPlayers = this.getWaitingPlayers(afterChange);

      output = this.mergeDerivedChange(
        output,
        waitingPlayers.length > 0
          ? {
              waitingPlayers,
              submittedAnswers: this.getSubmittedAnswersCount(submittedAnswers),
            }
          : {
              submittedAnswers: this.mergeSubmittedAnswer(submittedAnswers),
            },
      );
    }
    return output;
  }

  mergeData(
    input: RoundDataI,
    toMerge?: RoundDataI | RoundDataChange,
  ): RoundDataI {
    // check if value is defined and if it's a full RoundDataI
    if (toMerge && "currentJudge" in toMerge) {
      // if it's a full object, every aspect of it would be defined and override the existing values, so use this function to return a copy
      return this.mergeData(toMerge);
    }
    // get the unchanging values from input (can't be overriden by a change object)
    const { currentJudge, playersInRound, submittingPlayerKeys } = input;
    return {
      currentJudge,
      playersInRound: [...playersInRound],
      submittingPlayerKeys: {
        ...submittingPlayerKeys,
      },
      prompt: copyCard(toMerge?.prompt ?? input.prompt),
      submittedAnswers: this.mergeSubmittedAnswer(
        input.submittedAnswers,
        toMerge?.submittedAnswers,
      ),
    };
  }
  copy: (input: RoundDataI) => RoundDataI = (input) => this.mergeData(input);
  merge: (input: RoundDataI, toMerge: RoundDataI) => RoundDataI = (
    input,
    toMerge,
  ) => this.mergeData(input, toMerge);
  mergeWithChange: (input: RoundDataI, toMerge: RoundDataChange) => RoundDataI =
    (input, toMerge) => this.mergeData(input, toMerge);

  mergeOptionalChange(
    input: RoundDataChange,
    toMerge?: RoundDataChange,
  ): RoundDataChange {
    const output: RoundDataChange = {};
    const promptCard = toMerge?.prompt ?? input.prompt;
    if (promptCard) {
      output.prompt = copyCard(promptCard);
    }
    if (input.submittedAnswers) {
      output.submittedAnswers = this.mergeSubmittedAnswer(
        input.submittedAnswers,
        toMerge?.submittedAnswers,
      );
    } else if (toMerge?.submittedAnswers) {
      output.submittedAnswers = this.mergeSubmittedAnswer(
        toMerge.submittedAnswers,
      );
    }
    return output;
  }

  mergeDerivedOptional(
    input: PublicRoundChange,
    toMerge?: PublicRoundChange,
  ): PublicRoundChange {
    let readyAnswers: undefined | RoundDataI["submittedAnswers"];
    const waitingData: PublicJudgeWaitingChange = {};

    if (toMerge && "waitingPlayers" in toMerge) {
      waitingData.waitingPlayers = [...toMerge.waitingPlayers];
    } else if ("waitingPlayers" in input) {
      waitingData.waitingPlayers = input.waitingPlayers;
    }

    const inputAnswers = input.submittedAnswers;
    const mergeAnswers = toMerge?.submittedAnswers;

    if (mergeAnswers && typeof mergeAnswers === "number") {
      waitingData.submittedAnswers = mergeAnswers;
    } else if (inputAnswers && typeof inputAnswers === "number") {
      waitingData.submittedAnswers = inputAnswers;
    }

    if (inputAnswers && typeof inputAnswers !== "number") {
      readyAnswers = this.mergeSubmittedAnswer(
        inputAnswers,
        mergeAnswers && typeof mergeAnswers !== "number"
          ? mergeAnswers
          : undefined,
      );
    } else if (mergeAnswers && typeof mergeAnswers !== "number") {
      readyAnswers = this.mergeSubmittedAnswer(mergeAnswers);
    }

    let output: PublicRoundChange = {};
    if (readyAnswers) {
      output = {
        submittedAnswers: readyAnswers,
      };
      return output;
    } else if (Object.keys(waitingData).length > 0) {
      output = {
        ...waitingData,
      };
    }

    const promptCard = toMerge?.prompt ?? input.prompt;
    if (promptCard) {
      output.prompt = copyCard(promptCard);
    }
    return output;
  }

  mergeDerivedChange: (
    input: PublicRoundChange,
    toMerge: PublicRoundChange,
  ) => PublicRoundChange = (input, toMerge) =>
    this.mergeDerivedOptional(input, toMerge);
  copyDerivedChange: (input: PublicRoundChange) => PublicRoundChange = (
    input,
  ) => this.mergeDerivedOptional(input);
}

export const roundDataManager = new RoundDataManager();

export class RoundData extends DerivedDataClass<
  RoundDataI,
  PublicRoundData,
  RoundDataChange,
  PublicRoundChange,
  RoundDataManager
> {
  constructor(
    ...args:
      | Parameters<RoundDataManager["initializeData"]>
      | [input: RoundDataI]
  ) {
    function isInitialDataArgs(
      input:
        | Parameters<RoundDataManager["initializeData"]>
        | [input: RoundDataI],
    ): input is Parameters<RoundDataManager["initializeData"]> {
      const firstArg = args[0];
      return "type" in firstArg && firstArg.type === CARD_TYPES.PROMPT;
    }
    const initialData = isInitialDataArgs(args)
      ? roundDataManager.initializeData(...args)
      : args[0];
    super(roundDataManager, initialData);
  }
}
