import { CARD_TYPES } from "./game_types";
// importing types seperately so I don't need to use `type` for all but one item
import type {
  MetaDataI,
  GameStateI,
  PlayerStateI,
  CardDeck,
  CardMultiDeck,
  DerivedType,
  DerivedObjType,
  CardType,
  PromptCard,
  AnswerCard,
  TurnDataI,
  GamePrimativeTypes,
  PrimativeDerivedType,
  PrimativeDerivedArrayType,
  RootDerivedTypes,
} from "./game_types";

export function isCardType(val: RootDerivedTypes): val is CardType {
  if (
    val !== null &&
    !Array.isArray(val) &&
    typeof val === "object" &&
    val.id &&
    val.type &&
    [CARD_TYPES.ANSWER, CARD_TYPES.PROMPT].includes((val as CardType).type)
  ) {
    return true;
  }
  return false;
}

export function hiddenDeck<T extends CardType>(
  deck: CardDeck,
  useLength = true,
): DerivedType<CardDeck<T>> {
  return useLength ? deck.length : new Array(deck.length);
}

export function hiddenMultiDeck(
  deck: CardMultiDeck,
): DerivedType<CardMultiDeck> {
  return {
    [CARD_TYPES.ANSWER]: hiddenDeck<AnswerCard>(deck[CARD_TYPES.ANSWER]),
    [CARD_TYPES.PROMPT]: hiddenDeck<PromptCard>(deck[CARD_TYPES.PROMPT]),
  };
}

/**
 * Utility for merging derived values to get the final state. Ex. merging (publicState, playersState)
 * @param current current derived state
 * @param next next derived state to merge on top
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _mergeDerivedItems<T extends RootDerivedTypes>(
  current: T,
  next: T,
): T {
  // return current if they match or if next is falsy
  if (current === next) {
    return current;
  }
  // if current is undefined/null, return next assuming it is same or more defined
  if (typeof current === "undefined" || current === null) {
    return next;
  }
  // if next is undefined or null, it doesn't have new information, and since current has been checked, it's safe to say it has more information provided
  if (typeof next === "undefined" || next === null) {
    return current;
  }
  // check for array states, since they can have unique derived states.
  const currentIsArray = Array.isArray(current);
  const nextIsArray = Array.isArray(next);
  // unique behavior only matters if one is an array and the other isn't
  if (currentIsArray !== nextIsArray) {
    // whicever is an array has more details and is kept
    return currentIsArray ? current : next;
  }
  // recursively merge array values
  if (currentIsArray && nextIsArray) {
    let length = next.length;

    if (current.length !== next.length) {
      console.log(
        "current + next are arrays but of different lengths, don't think this should happen? merging could have odd behavior. current-",
        current,
        " next- ",
        next,
      );
      // use the longer length of the two I guess?
      length = Math.max(current.length, next.length);
    }

    return new Array(length).map((_val, index) => {
      const currentVal = current[index];
      const nextVal = next[index];
      return _mergeDerivedItems(currentVal, nextVal);
    }) as T;
  }
  /**
   * check for primatives:
   * base types we would expect to flatly use/replace are number/string/boolean/CardType
   * we will check for these types, and assume if it's not one it is an an array/object that we can merge recursively
   * would only get to this point if the primatives do not match (or are the same card but seperate instances that would fail === checks) which seems unlikely so I'll log when it happens
   */
  // if next is a card, return it (if current is a card too, assume they match or next is one to keep)
  if (isCardType(next)) {
    return next;
  }
  // this seems unlikely but could happen?
  if (isCardType(current)) {
    console.info(
      "merging next is not a card type but current value is? current- ",
      current,
      " next- ",
      next,
    );
    return current;
  }
  if (["number", "string", "boolean"].includes(typeof next)) {
    console.info(
      "merging next is primative type. Should only hit this point if both current+next are not undefined/null, and do not match, which seems unlikely? current- ",
      current,
      " next- ",
      next,
    );
    return next;
  }
  if (["number", "string", "boolean"].includes(typeof current)) {
    console.info(
      "merging current is primative type but not next. Should only hit this point if both current+next are not undefined/null, and do not match, which seems unlikely? current- ",
      current,
      " next- ",
      next,
    );
    return current;
  }
  // call recursively through object values
  return [...new Set([...Object.keys(current), ...Object.keys(next)])].reduce(
    (output, key) => {
      const currentVal = current[key] as RootDerivedTypes;
      const nextVal = next[key] as RootDerivedTypes;
      output[key] = _mergeDerivedItems(currentVal, nextVal);
      return output;
    },
    {} as Record<string, RootDerivedTypes>,
  ) as T;
}

export function mergeDerivedValue(
  ...states: RootDerivedTypes[]
): RootDerivedTypes {
  return states.reduce((currentState, nextState) => {
    return _mergeDerivedItems(currentState, nextState);
  }, null as RootDerivedTypes);
}
