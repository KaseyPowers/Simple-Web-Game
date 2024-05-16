import { DataManager } from "../../data_manager";

import { allCardTypes, type CardDeck, type CardType } from "./cards_types";

export class CardAndDeckManager extends DataManager<
  CardDeck,
  Partial<CardDeck>
> {
  copyCard<T extends CardType>(card: T): T {
    return {
      ...card,
      value: Array.isArray(card.value) ? [...card.value] : card.value,
    };
  }

  copyCardArr<T extends CardType>(input: T[]): T[] {
    return input.map((card) => this.copyCard(card));
  }

  protected mergeAnyData<T extends CardDeck | Partial<CardDeck>>(
    input: T,
    toMerge?: Partial<CardDeck> | T | undefined,
  ): T {
    const output: Partial<T> = {};

    const promptCards =
      toMerge?.[allCardTypes.prompt] ?? input[allCardTypes.prompt];

    if (promptCards) {
      output[allCardTypes.prompt] = this.copyCardArr(promptCards);
    }

    const answerCards =
      toMerge?.[allCardTypes.answer] ?? input[allCardTypes.answer];

    if (answerCards) {
      output[allCardTypes.answer] = this.copyCardArr(answerCards);
    }
    return output as T;
  }
}

export const cardAndDeckManager = new CardAndDeckManager();
