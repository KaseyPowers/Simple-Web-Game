import { diff } from "jest-diff";
import type { MatcherFunction } from "expect";

export const toBeArrayWith: MatcherFunction<[expected: unknown]> = function (
  received,
  expected,
) {
  if (!Array.isArray(received) || !Array.isArray(expected)) {
    throw new TypeError("These must be arrays!");
  }

  let pass = false;
  // even if not the same order, they do need to be the same length
  if (received.length === expected.length) {
    const counts = new Map<unknown, number>();
    // actual will increase each value by 1
    received.forEach((val) => {
      counts.set(val, (counts.get(val) ?? 0) + 1);
    });
    // expected will decrease by 1
    expected.forEach((val) => {
      counts.set(val, (counts.get(val) ?? 0) - 1);
    });
    // if they match, would cancel out to all 0's
    pass = Array.from(counts.values()).every((count) => count === 0);
  }
  const options = {
    comment: "compare array without order",
    isNot: this.isNot,
    promise: this.promise,
  };

  const message = pass
    ? () => {
        return `${this.utils.matcherHint("toBeArrayWith", undefined, undefined, options)}
        
        Expected: not ${this.utils.printExpected(expected)}
        Received: ${this.utils.printReceived(received)}`;
      }
    : () => {
        const diffString = diff(expected, received, {
          expand: this.expand,
        });
        return (
          this.utils.matcherHint(
            "toBeArrayWith",
            undefined,
            undefined,
            options,
          ) +
          `\n\n${
            diffString && diffString.includes("- Expect")
              ? `Difference:\n\n${diffString}`
              : `Expected: ${this.utils.printExpected(expected)}
        Received: ${this.utils.printReceived(received)}`
          }`
        );
      };

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
