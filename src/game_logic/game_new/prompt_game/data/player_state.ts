import { DerivedDataManager, DerivedDataClass } from "../../data_manager";

import type { AnswerCard, PromptCard } from "./cards_types";
import { copyCard, copyCardArr } from "./cards_utils";

type WonHandTuple = [PromptCard, AnswerCard[]];

export interface PlayerStateI {
  // current hand of cards
  hand: AnswerCard[];
  // track the hands won with the winning prompt+answer combination. These will be copies of the cards, will still discard all cards to keep the total cards in play consistent (if using discard piles, could just reshuffle all cards when starting over and ignoring chance of duplicates of cards currently in someone's hand?)
  wonHands: WonHandTuple[];
}
export type PlayerStateChange = Partial<PlayerStateI>;

export interface PublicPlayerState {
  hand: number;
  wonHands: number;
}

export type PublicPlayerStateChange = Partial<PublicPlayerState>;

type DerivedType = {
  publicData: PublicPlayerState;
  playerOnly: PlayerStateI;
};

type DerivedChange = {
  publicData?: PublicPlayerStateChange;
  playerOnly?: PlayerStateChange;
};

export class PlayerStateManager extends DerivedDataManager<
  PlayerStateI,
  DerivedType,
  PlayerStateChange,
  DerivedChange
> {
  defaultData: PlayerStateI = {
    hand: [],
    wonHands: [],
  };
  initializeData: (input?: PlayerStateI | PlayerStateChange) => PlayerStateI = (
    input,
  ) => {
    return this.mergeAnyData(this.defaultData, input);
  };
  private copyWonHands(input: WonHandTuple[]): WonHandTuple[] {
    return input.map(([prompt, answers]) => [
      copyCard(prompt),
      copyCardArr(answers),
    ]);
  }
  protected mergeAnyData<T extends PlayerStateI | Partial<PlayerStateI>>(
    input: T,
    toMerge?: Partial<PlayerStateI> | T | undefined,
  ): T {
    const output: Partial<PlayerStateI> = {};
    // both values can't be merged so we just check for the second value first to use, otherwise use first value if it exists
    if (toMerge && "hand" in toMerge) {
      output.hand = copyCardArr(toMerge.hand);
    } else if ("hand" in input) {
      output.hand = copyCardArr(input.hand);
    }

    if (toMerge && "wonHands" in toMerge) {
      output.wonHands = this.copyWonHands(toMerge.wonHands);
    } else if ("wonHands" in input) {
      output.wonHands = this.copyWonHands(input.wonHands);
    }

    return output as T;
  }

  toDerived({ hand, wonHands }: PlayerStateI): DerivedType {
    return {
      publicData: {
        hand: hand.length,
        wonHands: wonHands.length,
      },
      playerOnly: {
        hand: copyCardArr(hand),
        wonHands: this.copyWonHands(wonHands),
      },
    };
  }
  mergeDerivedChange(
    input: DerivedChange,
    toMerge: DerivedChange,
  ): DerivedChange {
    const output: DerivedChange = {};
    if ("publicData" in input || "publicData" in toMerge) {
      // we know this only has primative types so easy merge
      const publicData: DerivedChange["publicData"] = {
        ...input.publicData,
        ...toMerge.publicData,
      };
      if (Object.keys(publicData).length > 0) {
        output.publicData = publicData;
      }
    }

    if ("playerOnly" in input) {
      output.playerOnly = this.mergeAnyData(
        input.playerOnly,
        toMerge.playerOnly,
      );
    } else if ("playerOnly" in toMerge) {
      output.playerOnly = this.copyChange(toMerge.playerOnly);
    }
    if (output.playerOnly && Object.keys(output.playerOnly).length <= 0) {
      delete output.playerOnly;
    }
    return output;
  }

  toDerivedChange(input: Partial<PlayerStateI>): DerivedChange {
    let output: DerivedChange = {};

    if ("hand" in input) {
      const hand = input.hand;
      output = this.mergeDerivedChange(output, {
        publicData: {
          hand: hand.length,
        },
        playerOnly: {
          hand,
        },
      });
    }
    if ("wonHands" in input) {
      const wonHands = input.wonHands;
      output = this.mergeDerivedChange(output, {
        publicData: {
          wonHands: wonHands.length,
        },
        playerOnly: {
          wonHands,
        },
      });
    }
    return output;
  }
}

export const playerStateManager = new PlayerStateManager();

export class PlayerStateData extends DerivedDataClass<
  PlayerStateI,
  DerivedType,
  PlayerStateChange,
  DerivedChange,
  PlayerStateManager
> {
  constructor(input?: PlayerStateI | PlayerStateChange) {
    const initialData = playerStateManager.initializeData(input);
    super(playerStateManager, initialData);
  }
}
