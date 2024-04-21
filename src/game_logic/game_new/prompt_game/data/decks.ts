import type { DeepPartial, UnPartial } from "~/utils/types";
import type { DerivedTypesObj } from "../../data/types";
import type { CardDeck, CardByType, CardType } from "../game_types";
import { DataClass } from "../../data/data_class";

import { CARD_TYPES } from "../game_types";
import { shuffle } from "~/utils/shuffle";

export interface DecksI {
  deck: CardDeck;
  discardPile: CardDeck;
}

type DecksIType<Type extends CARD_TYPES> = {
  [K in keyof DecksI]: Pick<CardDeck, Type>;
};

type IsDeckEmpty = Record<CARD_TYPES, boolean>;
export type PublicDecksI = {
  [K in keyof DecksI]: IsDeckEmpty;
};

type DerivedObj = DerivedTypesObj<PublicDecksI>;

type DataChange = DeepPartial<DecksI, CardType>;
type DerivedChange = DeepPartial<DerivedObj, CardType>;

export class DecksData extends DataClass<
  DecksI,
  DerivedObj,
  DataChange,
  DerivedChange
> {
  drawCard<Type extends CARD_TYPES>(type: Type) {
    return DecksData.drawDataCard<Type>(type, this.data);
  }
  // create a new instance of class, shuffling the cards before using
  static createDecks(allCards: CardDeck) {
    const initialData: DecksI = {
      deck: {
        [CARD_TYPES.ANSWER]: shuffle(allCards[CARD_TYPES.ANSWER]),
        [CARD_TYPES.PROMPT]: shuffle(allCards[CARD_TYPES.PROMPT]),
      },
      discardPile: {
        [CARD_TYPES.ANSWER]: [],
        [CARD_TYPES.PROMPT]: [],
      },
    };
    return new DecksData(initialData);
  }

  // draw a card given the deck and discardPile
  static drawCard<Type extends CardType>(deck: Type[], discardPile: Type[]) {
    const [drawnCard, ...nextDeck] = deck;
    if (!drawnCard) {
      throw new Error(
        "Drawn card is undefined, this should only happen if deck was empty before drawing, which shoudlnt' be possible",
      );
    }
    const output: [drawnCard: Type, newDeck: Type[], discardPile?: Type[]] = [
      drawnCard,
      nextDeck,
    ];

    if (nextDeck.length <= 0) {
      if (discardPile.length <= 0) {
        throw new Error(
          "Uhoh! the discard pile is also empty! TBD how to fix this...",
        );
      }
      output[1] = shuffle(discardPile);
      output[2] = [];
    }
    return output;
  }

  static drawDataCard<Type extends CARD_TYPES>(
    type: Type,
    from: DecksIType<Type>,
  ): [CardByType[Type], DataChange] {
    const [drawnCard, changedDeck, changedDiscard] = DecksData.drawCard<
      CardByType[Type]
    >(from.deck[type], from.discardPile[type]);

    const changes: DataChange = {
      deck: {
        [type]: changedDeck,
      },
    };
    if (changedDiscard) {
      changes.discardPile = {
        [type]: changedDiscard,
      };
    }
    return [drawnCard, changes];
  }

  createDerivedFrom(input: DecksI): DerivedObj {
    return {
      publicData: {
        deck: {
          [CARD_TYPES.PROMPT]: input.deck[CARD_TYPES.PROMPT].length > 0,
          [CARD_TYPES.ANSWER]: input.deck[CARD_TYPES.ANSWER].length > 0,
        },
        discardPile: {
          [CARD_TYPES.PROMPT]: input.discardPile[CARD_TYPES.PROMPT].length > 0,
          [CARD_TYPES.ANSWER]: input.discardPile[CARD_TYPES.ANSWER].length > 0,
        },
      },
    };
  }
  createPartialDerived(input: DataChange): DerivedChange {
    let output: DerivedChange["publicData"];

    function setOutput(
      key1: keyof UnPartial<DerivedChange>["publicData"],
      key2: CARD_TYPES,
      value: boolean,
    ) {
      output = {
        ...output,
        [key1]: {
          ...(output?.[key1] ?? {}),
          [key2]: value,
        },
      };
    }

    if ("deck" in input) {
      const deck = input.deck!;
      if (CARD_TYPES.PROMPT in deck) {
        setOutput("deck", CARD_TYPES.PROMPT, !!deck[CARD_TYPES.PROMPT]?.length);
      }
      if (CARD_TYPES.ANSWER in deck) {
        setOutput("deck", CARD_TYPES.ANSWER, !!deck[CARD_TYPES.ANSWER]?.length);
      }
    }

    if ("discardPile" in input) {
      const discard = input.discardPile!;
      if (CARD_TYPES.PROMPT in discard) {
        setOutput(
          "discardPile",
          CARD_TYPES.PROMPT,
          !!discard[CARD_TYPES.PROMPT]?.length,
        );
      }
      if (CARD_TYPES.ANSWER in discard) {
        setOutput(
          "discardPile",
          CARD_TYPES.ANSWER,
          !!discard[CARD_TYPES.ANSWER]?.length,
        );
      }
    }
    return output ? { publicData: output } : {};
  }
}
