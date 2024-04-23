import { DataClass } from "../../data_class";

import type { AnswerCard, PromptCard } from "../game_types";
import { shuffle } from "~/utils/shuffle";

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

// make sure that we don't allow changes to certain values. They can only change when creating a new round
type RoundDataChange = Partial<
  Omit<RoundDataI, "currentJudge" | "playersInRound" | "submittingPlayerKeys">
>;

type PublicRoundData = CommonRoundDataI &
  (
    | {
        /** Reveal which players we are waiting to submit */
        waitingPlayers: string[];
        // the number of players who have submitted
        submittedAnswers: number;
      }
    | Pick<RoundDataI, "submittedAnswers">
  );

type PublicDataChange = Partial<PublicRoundData>;

export class RoundData extends DataClass<
  RoundDataI,
  PublicRoundData,
  RoundDataChange,
  PublicDataChange
> {
  static submittedAnswersKey = (index: number) => `submitting_player_#${index}`;

  static initialData(
    prompt: PromptCard,
    allPlayers: string[],
    previousJudge?: string,
  ) {
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
        output[key] = RoundData.submittedAnswersKey(index);
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
  }

  static createNew(...args: Parameters<typeof RoundData.initialData>) {
    const initialData = RoundData.initialData(...args);
    return new RoundData(initialData);
  }

  // getWaitingPlayers(input: Pick<RoundDataI, "playersInRound" | "submittedAnswers" | "submittingPlayerKeys">): string[] {
  //   const {playersInRound, submittedAnswers, submittingPlayerKeys} = input;
  //   return playersInRound.filter(id => {
  //     const key = submittingPlayerKeys[id];
  //     return !(key && submittedAnswers[key]);
  //   });
  // }

  // always require submittedAnswers, but allow the others to be undefined
  getWaitingPlayers(
    input: Pick<RoundDataI, "submittedAnswers"> &
      Partial<Pick<RoundDataI, "playersInRound" | "submittingPlayerKeys">>,
  ): string[] {
    // merge the current data with this to provide default values, but expect submittedAnswers to always be defined if called from a data change
    const { playersInRound, submittedAnswers, submittingPlayerKeys } = {
      ...this.data,
      ...input,
    };
    return playersInRound.filter((id) => {
      const key = submittingPlayerKeys[id];
      return !(key && submittedAnswers[key]);
    });
  }

  getSubmittingAnswersCount(input: RoundDataI["submittedAnswers"]): number {
    // to convert this object to a size, we first grab all keys, and filter out to only keep keys whose value is a not-empty array. Once done, we return the length of the valid keys array
    return Object.keys(input).filter((key) => {
      const value = input[key];
      return !!value?.length;
    }).length;
  }

  createDerivedData(input: RoundDataI): PublicRoundData {
    const { prompt, currentJudge, submittedAnswers } = input;
    const waitingPlayers = this.getWaitingPlayers(input);

    return {
      prompt,
      currentJudge,
      ...(waitingPlayers.length > 0
        ? {
            waitingPlayers,
            submittedAnswers: this.getSubmittingAnswersCount(submittedAnswers),
          }
        : {
            submittedAnswers,
          }),
    };
  }

  createDerivedChange(input: RoundDataChange): PublicDataChange {
    let output: PublicDataChange = {};

    if ("prompt" in input) {
      const prompt = input.prompt!;
      output.prompt = prompt;
    }
    if ("submittedAnswers" in input) {
      const submittedAnswers = input.submittedAnswers!;
      const waitingPlayers = this.getWaitingPlayers({
        submittedAnswers,
      });
      output = this.mergeDerivedData(
        output,
        waitingPlayers.length > 0
          ? {
              waitingPlayers,
              submittedAnswers:
                this.getSubmittingAnswersCount(submittedAnswers),
            }
          : {
              submittedAnswers,
            },
      );
    }

    return output;
  }
}
