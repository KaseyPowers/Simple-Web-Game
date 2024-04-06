import "@testing-library/jest-dom";

import { expect } from "@jest/globals";
import type { MatcherFunction } from "expect";
import { toBeArrayWith } from "./src/utils/test_utils/compare_arrays";

expect.extend({
  toBeArrayWith,
  arrayWith: toBeArrayWith,
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeArrayWith(expected: unknown[]): R;
    }

    interface Expect {
      arrayWith<T extends unknown[]>(expected: T): T;
    }

    interface ExpectExtendMap {
      // Here, we're describing the call signature of our

      // matcher for the "expect.extend()" call.

      toBeWithinRange: MatcherFunction<[expected: unknown[]]>;
      arrayWith: MatcherFunction<[expected: unknown[]]>;
    }
  }
}
