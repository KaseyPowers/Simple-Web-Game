import type { DeepPartial, KeysWith, UnPartial } from "~/utils/types";
import type {
  DerivedTypesObj,
  DataChangeType,
  DerivedChangeType,
} from "../../data/types";
import { DataClass, derivedObjPublicKey } from "../../data/data_class";

import type { AnswerCard, CardType, PromptCard } from "../game_types";
import { shuffleInPlace } from "~/utils/shuffle";

/** Turn interface to track information about current turn/round */
export interface RoundDataI {
  /** Could track the current round, and use roundNumber % playerIds.length to get the current judge, but would get messy if player count can change during the game  */
  /** the current_judge stores the id of the current player, was originally storing a number to reference player in array of players in game, but again could get messy if dealing with players joining/leaving the game  */
  currentJudge: string;
  /** Each round defined by the prompt card that each player submits an answer for */
  prompt: PromptCard;
  // seperate array of playerIds that get's shuffled. then the public submittedAnswers will use the indexes of this array to obfuscate the keys
  submittingPlayers: string[];
  /** Track all the players submissions, game state knows who's is who's, but will not show that to the judge */
  submittedAnswers: Record<string, AnswerCard[]>;
}
export interface PublicRoundDataI
  extends Pick<RoundDataI, "currentJudge" | "prompt"> {
  /** Will return an array, where each number is the length of the answer (in case the prompt somehow accepts a range of answer sizes) */
  submittedAnswers: number;
  /** Reveal which players we are waiting to submit */
  waitingPlayers: string[];
}

export type JudgeReadyI = Pick<RoundDataI, "submittedAnswers"> &
  Omit<PublicRoundDataI, "submittedAnswers">;

export function submittingAnswerKey(submittingPlayerIndex: number) {
  return `submitting_player_#${submittingPlayerIndex}`;
}

// For some reason using "ExternalType" for the judge-only data seems bad but that's sort of what it was designed for (unless we have another type to expose in different contexts)
type DerivedObj = DerivedTypesObj<PublicRoundDataI, JudgeReadyI, "judgeData">;

// Make sure the card types aren't partialled
type DataChange = Partial<RoundDataI>;
type DerivedChange = DerivedChangeType<DerivedObj, CardType>;

export class RoundData extends DataClass<
  RoundDataI,
  DerivedObj,
  DataChange,
  DerivedChange
> {
  static createRoundData(
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
    const nextSubmittingPlayers = [...allPlayers];
    // then remove the new judge's value from the array
    nextSubmittingPlayers.splice(nextJudgeIndex, 1);
    // lastly shuffle the list of players to hide from the judge who submitted what answer
    shuffleInPlace(nextSubmittingPlayers);

    return new RoundData({
      currentJudge: nextJudge,
      prompt,
      submittingPlayers: nextSubmittingPlayers,
      submittedAnswers: {},
    });
  }

  getPublicSubmittedAnswer({
    submittedAnswers,
  }: Pick<RoundDataI, "submittedAnswers">): number {
    // take all the keys, keeping only the keys that have a submission (defined + array not empty), then return the length of that array
    return Object.keys(submittedAnswers).filter((key) => {
      const value = submittedAnswers[key];
      return value?.length;
    }).length;
  }
  getPublicWaitingPlayers(
    input: Pick<RoundDataI, "submittedAnswers" | "submittingPlayers">,
  ): string[] {
    // return the submitting players but filter out the ones that have answers submitted
    return input.submittingPlayers.filter((id) => !input.submittedAnswers[id]);
  }

  createDerivedFrom(input: RoundDataI): DerivedObj {
    const { currentJudge, prompt } = input;
    const publicData: PublicRoundDataI = {
      currentJudge,
      prompt,
      waitingPlayers: this.getPublicWaitingPlayers(input),
      submittedAnswers: this.getPublicSubmittedAnswer(input),
    };
    // prepare the judge ready data then check condition before returning
    const judgeReadyData: JudgeReadyI = {
      ...publicData,
      submittedAnswers: input.submittedAnswers,
    };

    return {
      [derivedObjPublicKey]: publicData,
      judgeData:
        publicData.waitingPlayers.length > 0 ? publicData : judgeReadyData,
    };
  }
  // get the public type to potentially copy into the judge data
  getPartialPublic(input: DataChange): undefined | Partial<PublicRoundDataI> {
    let output: undefined | Partial<PublicRoundDataI>;
    function setVal<Key extends keyof PublicRoundDataI>(
      key: Key,
      val: PublicRoundDataI[Key],
    ) {
      output = {
        ...(output ?? {}),
        [key]: val,
      };
    }
    // simple checks between input and output public type
    if ("currentJudge" in input) {
      setVal("currentJudge", input.currentJudge!);
    }
    if ("prompt" in input) {
      setVal("prompt", input.prompt!);
    }
    const answersChanged = "submittedAnswers" in input;
    if (answersChanged) {
      setVal(
        "submittedAnswers",
        this.getPublicSubmittedAnswer({
          submittedAnswers: input.submittedAnswers!,
        }),
      );
    }
    if (answersChanged || "submittingPlayers" in input) {
      setVal(
        "waitingPlayers",
        this.getPublicWaitingPlayers({
          // expecting at least one of these to be provided, with either key defaulting to the current data's value for calculated output
          submittedAnswers:
            input.submittedAnswers ?? this.data.submittedAnswers,
          submittingPlayers:
            input.submittingPlayers ?? this.data.submittingPlayers,
        }),
      );
    }
    return output;
  }

  createPartialDerived(input: DataChange): DerivedChange {
    const output: DerivedChange = {};

    const publicData = this.getPartialPublic(input);
    if (publicData) {
      output.publicData = publicData;
      // judge value would only be set if publicData has a change too
      // set it to the same thing as public data to start, then conditonally check if we should do the full data version
      output.judgeData = publicData;

      // full judge data only changes the sumbittedAnswers value, and conditionally based on the waitingPlayers array
      // changes to either will mean the waitingPlayers array is in the public data
      if (
        "waitingPlayers" in publicData &&
        publicData.waitingPlayers!.length <= 0
      ) {
        // assume that whatever change got to this point also means that the full submittedAnswers object should be applied as well
        this.setDerivedValue(
          output,
          "judgeData",
          "submittedAnswers",
          input.submittedAnswers ?? this.data.submittedAnswers,
        );
      }
    }

    return output;
  }
}
