import { DataManager, DataClass } from "../../data_manager";

import type { CardDeck, CardByType } from "./cards_types";
import { CARD_TYPES } from "./cards_types";
import { shuffle } from "~/utils/shuffle";
import { copyDeck, mergeDeck } from "./cards_utils";

export interface DecksDataI {
  deck: CardDeck;
  discardPile: CardDeck;
}

export type DecksDataChange = {
  [K in keyof DecksDataI]?: Partial<DecksDataI[K]>;
};

export class DecksManager extends DataManager<DecksDataI, DecksDataChange> {
  initializeData = (allCards: CardDeck): DecksDataI => ({
    deck: {
      [CARD_TYPES.ANSWER]: shuffle(allCards[CARD_TYPES.ANSWER]),
      [CARD_TYPES.PROMPT]: shuffle(allCards[CARD_TYPES.PROMPT]),
    },
    discardPile: {
      [CARD_TYPES.ANSWER]: [],
      [CARD_TYPES.PROMPT]: [],
    },
  });

  protected mergeAnyData<T extends DecksDataI | DecksDataChange>(
    first: T,
    second?: T | DecksDataChange,
  ): T {
    return (["deck", "discardPile"] as (keyof DecksDataI)[]).reduce(
      (output, key) => {
        // if this key is in first object, merge it with the potential second value.
        // if not in first check if second has it anyway, and copy that value if so
        if (key in first) {
          output[key] = mergeDeck(first[key]!, second?.[key]);
        } else if (second && key in second) {
          output[key] = copyDeck(second[key]!);
        }

        return output;
      },
      {} as DecksDataChange,
    ) as T;
  }
}

export const decksManager = new DecksManager();

export class DecksData extends DataClass<
  DecksDataI,
  DecksDataChange,
  DecksManager
> {
  constructor(input: DecksDataI | CardDeck) {
    let initialData: DecksDataI;
    if ("deck" in input) {
      initialData = input;
    } else {
      initialData = decksManager.initializeData(input);
    }
    super(decksManager, initialData);
  }

  drawCard<Type extends CARD_TYPES>(
    type: Type,
  ): [drawnCard: CardByType[Type], nextData: this, change: DecksDataChange] {
    const [drawnCard, ...newDeck] = this.data.deck[type];
    if (!drawnCard) {
      throw new Error(
        "Drawn card is undefined, this should only happen if deck was empty before drawing, which shoudlnt' be possible",
      );
    }
    let output: DecksDataChange = {
      deck: {
        [type]: newDeck,
      },
    };
    if (newDeck.length <= 0) {
      const discardPile = this.data.discardPile[type];
      if (discardPile.length <= 0) {
        throw new Error(
          "Uhoh! the discard deck is also empty! TBD how to fix this...",
        );
      }
      output = {
        deck: {
          [type]: shuffle(discardPile),
        },
        discardPile: {
          [type]: [],
        },
      };
    }
    return [drawnCard, this.applyChange(output), output];
  }
}
