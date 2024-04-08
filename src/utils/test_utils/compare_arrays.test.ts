type BasicTypes = string | number | boolean | undefined;
type BaseTestCase<T> = [T[], T[]];
const simpleTypeArrays: BaseTestCase<BasicTypes>[] = [
  [
    ["a", "b", "c", "d"],
    ["a", "c", "b", "d"],
  ],
  [
    [1, 2, 3, 4, 5],
    [1, 3, 2, 5, 4],
  ],
  [
    ["a", 2, 5, false, undefined, "c", "d"],
    [5, "a", undefined, 2, "d", false, "c"],
  ],
];

interface DuplicatesTestCase<T> {
  input: T[];
  expected: T[];
  noDups: T[];
  differentDups: T[];
}
const simpleTypeArraysWithDuplicates: DuplicatesTestCase<BasicTypes>[] = [
  {
    noDups: ["a", "b", "c", "d"],
    input: ["a", "b", "c", "d", "a", "c"],
    expected: ["a", "c", "b", "a", "d", "c"],
    differentDups: ["a", "d", "b", "b", "d", "c"],
  },
  {
    noDups: [1, 2, 3, 4, 5],
    input: [1, 2, 2, 3, 4, 5, 5],
    expected: [1, 5, 3, 2, 5, 4, 2],
    differentDups: [1, 5, 3, 4, 3, 4, 2],
  },
  {
    noDups: ["a", 2, 5, false, undefined, "c", "d"],
    input: ["a", 2, 2, 5, false, false, undefined, undefined, "c", "c", "d"],
    expected: [5, "c", false, 2, "a", undefined, 2, "d", false, "c", undefined],
    differentDups: [
      5,
      "a",
      false,
      "a",
      undefined,
      2,
      "d",
      false,
      "c",
      5,
      false,
    ],
  },
];

interface SimpleObjectI {
  id: string;
  name: string;
  count: number;
  flag: boolean;
  children: BasicTypes[];
  extraVal: true | undefined;
}
// use an object defined in both places to verify .is equality vs. deep equality
const testObject: SimpleObjectI = {
  id: "ID",
  name: "NAME",
  count: 1234,
  flag: true,
  children: ["a", 2, 5, false, undefined, "c", "d"],
  extraVal: undefined,
};

const testArraysWithObject: BaseTestCase<BasicTypes | SimpleObjectI>[] = [
  // mixed array
  [
    [1, 2, testObject, "a", undefined, true],
    [undefined, "a", 2, 1, true, testObject],
  ],
  // same array with duplicates
  [
    [true, 1, 2, testObject, "a", undefined, testObject, true],
    [undefined, testObject, true, "a", 2, 1, true, testObject],
  ],
  // simple mixed array but deep equality objects instead of referencing the same one
  [
    [
      "before",
      {
        id: "test_id",
        name: "hello world",
        count: 1,
        flag: false,
        children: ["hello world child", 23],
        extraVal: true,
      },
      "after",
    ],
    [
      "after",
      "before",
      {
        id: "test_id",
        name: "hello world",
        count: 1,
        flag: false,
        children: ["hello world child", 23],
        extraVal: true,
      },
    ],
  ],
];

describe("verify custom array matchers", () => {
  describe("expect(X).toBeArrayWith()", () => {
    // simple primative array types
    it.each(simpleTypeArrays)(
      "should work with simple type array and itself",
      (arr1) => {
        // verify equality check still works for setup first
        expect(arr1).toEqual(arr1);
        expect(arr1).toBeArrayWith(arr1);
      },
    );
    it.each(simpleTypeArrays)(
      "should work with simple type array in different order",
      (arr1, arr2) => {
        // verify equality check still works for setup first
        expect(arr1).not.toEqual(arr2);
        // wrapping each in a set should still be truthy
        expect(new Set(arr1)).toEqual(new Set(arr2));
        expect(arr1).toBeArrayWith(arr2);
        expect(arr2).toBeArrayWith(arr1);
      },
    );
    it.each(simpleTypeArraysWithDuplicates)(
      "should work with duplicates",
      ({ input, noDups, expected, differentDups }) => {
        // expect set to still work in varoius situations where toBeArrayWith would be useful
        const inputSet = new Set(input);
        expect(inputSet).toEqual(new Set(noDups));
        expect(inputSet).toEqual(new Set(expected));
        expect(inputSet).toEqual(new Set(differentDups));
        // expected pass
        expect(input).toBeArrayWith(expected);
        expect(expected).toBeArrayWith(input);
        // expect other situations to fail
        expect(input).not.toBeArrayWith(noDups);
        expect(noDups).not.toBeArrayWith(input);
        expect(input).not.toBeArrayWith(differentDups);
        expect(differentDups).not.toBeArrayWith(input);
      },
    );
    it.each(testArraysWithObject)(
      "should work with object values",
      (input, expected) => {
        expect(input).toBeArrayWith(expected);
      },
    );
  });

  describe("expect.arrayWith()", () => {
    // simple primative array types
    it.each(simpleTypeArrays)(
      "should work with simple type array and itself",
      (arr1) => {
        // wrap in object to use with `expect.objectContaining`?
        const wrappedForObject = {
          exampleArr: arr1,
        };
        // verify equality check still works for setup first
        expect(wrappedForObject).toEqual(
          expect.objectContaining({
            exampleArr: arr1,
          }),
        );
        expect(wrappedForObject).toEqual(
          expect.objectContaining({
            exampleArr: expect.arrayWith(arr1),
          }),
        );
        expect(arr1).toEqual(expect.arrayWith(arr1));
      },
    );
    it.each(simpleTypeArrays)(
      "should work with simple type array in different order",
      (arr1, arr2) => {
        const wrappedForObject = {
          exampleArr: arr1,
        };
        // verify equality check still works for setup first
        expect(wrappedForObject).not.toEqual(
          expect.objectContaining({
            exampleArr: arr2,
          }),
        );
        // wrapping each in a set should still be truthy
        expect(wrappedForObject).toEqual(
          expect.objectContaining({
            exampleArr: expect.arrayWith(arr2),
          }),
        );
        expect(arr1).toEqual(expect.arrayWith(arr2));
      },
    );
    it.each(simpleTypeArraysWithDuplicates)(
      "should work with duplicates",
      ({ input, noDups, expected, differentDups }) => {
        // expected pass
        expect(input).toEqual(expect.arrayWith(expected));
        // expect other situations to fail
        expect(input).not.toEqual(expect.arrayWith(noDups));
        expect(input).not.toEqual(expect.arrayWith(differentDups));
      },
    );
    it.each(testArraysWithObject)(
      "should work with object values",
      (input, expected) => {
        expect(input).toEqual(expect.arrayWith(expected));
      },
    );
  });
});
