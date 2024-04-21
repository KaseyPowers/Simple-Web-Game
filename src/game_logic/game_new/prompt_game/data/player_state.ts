import type { DeepPartial } from "~/utils/types";
import type {
  DataChangeType,
  DerivedChangeType,
  DerivedTypesObj,
} from "../../data/types";
import { DataClass, derivedObjPublicKey } from "../../data/data_class";

import type { AnswerCard, PromptCard, CardType } from "../game_types";

export interface PlayerStateI {
  // current hand of cards
  hand: AnswerCard[];
  // track the hands won with the winning prompt+answer combination. These will be copies of the cards, will still discard all cards to keep the total cards in play consistent (if using discard piles, could just reshuffle all cards when starting over and ignoring chance of duplicates of cards currently in someone's hand?)
  won_hands: [PromptCard, AnswerCard][];
}

type PlayerStateChangeType = Partial<PlayerStateI>;

export interface PublicPlayerState extends Omit<PlayerStateI, "hand"> {
  hand: number;
}

type DerivedObj = DerivedTypesObj<
  PublicPlayerState,
  PlayerStateI,
  never,
  "playerData"
>;

type DerivedChange = DerivedChangeType<DerivedObj, CardType>;

export class PlayerStateData extends DataClass<
  PlayerStateI,
  DerivedObj,
  PlayerStateChangeType,
  DerivedChange
> {
  static newPlayerState() {
    return new PlayerStateData({
      hand: [],
      won_hands: [],
    });
  }
  createDerivedFrom(input: PlayerStateI): DerivedObj {
    const { hand, won_hands } = input;
    return {
      [derivedObjPublicKey]: {
        hand: hand.length,
        won_hands,
      },
      playerData: {
        // be sure to shallow copy the array
        hand: [...hand],
        won_hands,
      },
    };
  }
  createPartialDerived(input: PlayerStateChangeType): DerivedChange {
    const output: DerivedChange = {};
    // assume that if it's in the state change, that it's different from the prevoius value (aka ignore equality checks)

    // checking each key individually if it's defined
    if ("hand" in input) {
      const newHand = input.hand!;
      this.setDerivedValue(output, derivedObjPublicKey, "hand", newHand.length);
      this.setDerivedValue(output, "playerData", "hand", newHand);
    }
    if ("won_hands" in input) {
      this.setDerivedValueBulk(
        output,
        [derivedObjPublicKey, "playerData"],
        "won_hands",
        input.won_hands!,
      );
    }
    return output;
  }
}
