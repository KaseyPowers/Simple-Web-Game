import { DataClass } from "../../data_class";

import type { AnswerCard, PromptCard } from "../game_types";

export interface PlayerStateI {
  // current hand of cards
  hand: AnswerCard[];
  // track the hands won with the winning prompt+answer combination. These will be copies of the cards, will still discard all cards to keep the total cards in play consistent (if using discard piles, could just reshuffle all cards when starting over and ignoring chance of duplicates of cards currently in someone's hand?)
  wonHands: [PromptCard, AnswerCard][];
}

type PlayerStateChange = Partial<PlayerStateI>;

export interface PublicPlayerState {
  hand: number;
  wonHands: number;
}

type PublicPlayerStateChange = Partial<PublicPlayerState>;

type DerivedType = {
  publicData: PublicPlayerState;
  playerOnly: PlayerStateI;
};
type DerivedChange = {
  publicData?: PublicPlayerStateChange;
  playerOnly?: PlayerStateChange;
};

export class PlayerStateData extends DataClass<
  PlayerStateI,
  DerivedType,
  PlayerStateChange,
  DerivedChange
> {
  static initialData(): PlayerStateI {
    return {
      hand: [],
      wonHands: [],
    };
  }
  static createNew() {
    return new PlayerStateData(PlayerStateData.initialData());
  }

  createDerivedData({ hand, wonHands }: PlayerStateI): DerivedType {
    return {
      publicData: {
        hand: hand.length,
        wonHands: wonHands.length,
      },
      playerOnly: {
        hand,
        wonHands,
      },
    };
  }

  // NOTE: when calling this, we assume the incoming change is valid, and we skip validating against previous value. So even if an array changed from ["a", "b"] -> ["a", "c"] and so had the same length, will currently send the length anyway to keep it simple and better to send a little too much data until we determine we need to optomize payloads.
  createDerivedChange(input: Partial<PlayerStateI>): DerivedChange {
    let output: DerivedChange = {};

    if ("hand" in input) {
      const hand = input.hand!;
      output = this.mergeDerivedData(output, {
        publicData: {
          hand: hand.length,
        },
        playerOnly: {
          hand,
        },
      });
    }
    if ("wonHands" in input) {
      const wonHands = input.wonHands!;
      output = this.mergeDerivedData(output, {
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
