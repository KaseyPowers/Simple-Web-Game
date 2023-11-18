
import { BaseUUIDItem} from "../../utils";

export type BaseCardType = BaseUUIDItem;

export type CardDeck = BaseCardType[];
export type MultiDeck = { [key: string]: CardDeck };

export type DeckType = CardDeck | MultiDeck;