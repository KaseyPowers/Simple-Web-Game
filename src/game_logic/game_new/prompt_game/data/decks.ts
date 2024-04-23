import type { DeepPartial } from "~/utils/types";
import type { CardDeck, CardByType, CardType } from "../game_types";
import {
  ActionFnType,
  DataOnlyClass,
  addDataActions,
  createActionsClass,
  createActionsClassFor,
} from "../../data_class";

import { CARD_TYPES } from "../game_types";
import { shuffle } from "~/utils/shuffle";

export interface DecksI {
  deck: CardDeck;
  discardPile: CardDeck;
}

type DataChange = {
  [K in keyof DecksI]?: Partial<DecksI[K]>;
};

function drawCard<Type extends CARD_TYPES>(
  input: DecksI,
  type: Type,
): [drawnCard: CardByType[Type], change: DataChange] {
  const [drawnCard, ...newDeck] = input.deck[type];
  if (!drawnCard) {
    throw new Error(
      "Drawn card is undefined, this should only happen if deck was empty before drawing, which shoudlnt' be possible",
    );
  }
  let output: DataChange = {
    deck: {
      [type]: newDeck,
    },
  };
  if (newDeck.length <= 0) {
    const discardPile = input.discardPile[type];
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
  return [drawnCard, output];
}

class DecksData extends DataOnlyClass<DecksI, DataChange> {
  constructor(input: CardDeck | DecksI) {
    let initialData: DecksI;

    if ("deck" in input) {
      initialData = input;
    } else {
      initialData = {
        deck: {
          [CARD_TYPES.ANSWER]: shuffle(input[CARD_TYPES.ANSWER]),
          [CARD_TYPES.PROMPT]: shuffle(input[CARD_TYPES.PROMPT]),
        },
        discardPile: {
          [CARD_TYPES.ANSWER]: [],
          [CARD_TYPES.PROMPT]: [],
        },
      };
    }
    super(initialData);
  }
}

// const DeckActionsClass = createActionsClassFor<DecksI, DataChange>()(DecksData)({
//     drawCard
// });
const DeckActionsClass = createActionsClass<DecksI, DataChange>(DecksData)({
  drawCard,
});

const example = new DeckActionsClass({
  [CARD_TYPES.ANSWER]: [],
  [CARD_TYPES.PROMPT]: [],
});

const response = example.onAction("draw", CARD_TYPES.ANSWER);
