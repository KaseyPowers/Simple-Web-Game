// base definition of ketLeague7

import { DataManager } from "../../data_manager";

export interface BaseCardI {
  id: string;
}

export type CardStack<T extends BaseCardI> = T[];

export class CardStackManager<Card extends BaseCardI> extends DataManager<
  CardStack<Card>,
  CardStack<Card>
> {
  copyCard(input: Card) {
    return {
      ...input,
    };
  }
}
