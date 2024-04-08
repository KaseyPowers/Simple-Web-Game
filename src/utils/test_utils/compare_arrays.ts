// import { diff } from "jest-diff";
import type { MatcherFunction } from "expect";

export const toBeArrayWith: MatcherFunction<[expected: unknown]> = function (
  received,
  expected,
) {
  if (!Array.isArray(received) || !Array.isArray(expected)) {
    throw new TypeError("These must be arrays!");
  }
  // if the arrays are equal to each other, can be done right away
  let pass = this.equals(received, expected);
  // even if not the same order, they do need to be the same length
  if (!pass && received.length === expected.length) {
    const counts = new Map<unknown, number>();

    const updateCount = (
      key: unknown,
      updateFn: (curent: number) => number,
    ) => {
      // default is passed in key
      let useKey = key;
      // check against existing keys to make map's handle deepEquality checking better
      for (const mapKey of counts.keys()) {
        // if the mapKey is deeply equal to an existing key, use the mapKey instead
        if (this.equals(mapKey, key)) {
          useKey = mapKey;
          break;
        }
      }
      // update the count using provided updater
      counts.set(useKey, updateFn(counts.get(useKey) ?? 0));
    };

    // actual will increase each value by 1
    received.forEach((val) => {
      updateCount(val, (count) => count + 1);
    });
    // expected will decrease by 1
    expected.forEach((val) => {
      updateCount(val, (count) => count - 1);
    });
    // if they match, would cancel out to all 0's
    pass = Array.from(counts.values()).every((count) => count === 0);
  }
  const options = {
    comment: "compare array without order",
    isNot: this.isNot,
    promise: this.promise,
  };

  const message = () => {
    return `${this.utils.matcherHint("toBeArrayWith", undefined, undefined, options)}
        
        Expected: not ${this.utils.printExpected(expected)}
        Received: ${this.utils.printReceived(received)}`;
  };

  // diffString doesn't seem to be helpful for this so commenting out for now
  // : () => {
  //     // const diffString = diff(expected, received, {
  //     //   expand: this.expand,
  //     // });
  //     return (
  //       this.utils.matcherHint(
  //         "toBeArrayWith",
  //         undefined,
  //         undefined,
  //         options,
  //       ) +
  //       `\n\n${
  //         diffString && diffString.includes("- Expect")
  //           ? `Difference:\n\n${diffString}`
  //           : `Expected: ${this.utils.printExpected(expected)}
  //     Received: ${this.utils.printReceived(received)}`
  //       }`
  //     );
  //   };

  return { message, pass };
};

declare module "expect" {
  interface AsymmetricMatchers {
    toBeArrayWith(expected: unknown[]): void;
  }
  interface Matchers<R> {
    toBeArrayWith(expected: unknown[]): R;
  }
}
