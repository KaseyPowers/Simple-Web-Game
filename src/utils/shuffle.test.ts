import { shuffle, shuffleInPlace } from "./shuffle";

const testArrayBase: number[] = Array(15)
  .fill(0)
  .map((_value, index) => index);

describe("shuffles the array", () => {
  let testArray: number[];

  beforeEach(() => {
    testArray = [...testArrayBase];
  });

  it("shuffle returns a new shuffled array", () => {
    expect(testArray).toEqual(testArrayBase);
    // shuffle test array
    const shuffled = shuffle(testArray);
    // make sure test array is unchanged
    expect(testArray).toEqual(testArrayBase);
    expect(shuffled).not.toEqual(testArray);
    expect(shuffled).toHaveLength(testArrayBase.length);
    expect(shuffled).toEqual(expect.arrayContaining(testArrayBase));
  });

  it("shuffleInPlace modifies the array", () => {
    expect(testArray).toEqual(testArrayBase);
    // shuffle test array
    const shuffled = shuffleInPlace(testArray);
    // make sure test array is unchanged
    expect(testArray).not.toEqual(testArrayBase);
    expect(shuffled).toBe(testArray);
    expect(shuffled).toHaveLength(testArrayBase.length);
    expect(shuffled).toEqual(expect.arrayContaining(testArrayBase));
  });
});
