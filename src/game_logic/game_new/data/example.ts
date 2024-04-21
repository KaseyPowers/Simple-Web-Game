import type { DerivedObjChange, DerivedObjTypes } from "./data_class";
import { DataClass, derivedObjPublicKey } from "./data_class";

interface PlayerStateI {
  hand: string[];
  score: number;
}

type DerivedObj = DerivedObjTypes<
  { hand: number; score: number },
  PlayerStateI,
  "isPlayer"
>;

class PlayerStateData extends DataClass<PlayerStateI, DerivedObj> {
  createDerived(input: PlayerStateI): DerivedObj {
    const { hand, score } = input;
    return {
      [derivedObjPublicKey]: {
        hand: hand.length,
        score,
      },
      isPlayer: {
        // be sure to shallow copy the array
        hand: [...hand],
        score,
      },
    };
  }
  createPartialDerived(
    input: Partial<PlayerStateI>,
  ): DerivedObjChange<DerivedObj> {
    const output: DerivedObjChange<DerivedObj> = {};
    // assume that if it's in the state change, that it's different from the prevoius value (aka ignore equality checks)

    // checking each key individually if it's defined
    if ("hand" in input) {
      const newHand = input.hand!;
      this.setDerivedValue(output, derivedObjPublicKey, "hand", newHand.length);
      this.setDerivedValue(output, "isPlayer", "hand", newHand);
    }

    if ("score" in input) {
      const newScore = input.score!;
      this.setDerivedValueBulk(
        output,
        [derivedObjPublicKey, "isPlayer"],
        "score",
        newScore,
      );
    }
    return output;
  }
}
