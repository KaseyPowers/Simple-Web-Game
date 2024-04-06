/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";
import {
  type UpdaterResponse,
  type UpdaterDef,
  type Updater,
  type InputParserFn,
  type UpdaterFnInput,
  type UpdateBuilderObj,
  type OnChangeFn,
  UpdaterInner,
} from "./updater_types";
import {
  basicInputParser,
  createUpdater,
  copyUpdater,
  extendUpdater,
  createUpdaterBuilder,
  getBuilderObj,
  getUpdaterFromBuilder,
} from "./updater";
import { makeUpdaterCall } from "./updater_test_utils";

// semi-complex interface to make sure various types of fields can be copied and tested accurately with utility
interface TestObjI {
  string: string;
  number: number;
  falsyString: "";
  faslyNumber: 0;
  array: number[];
  set: Set<string>;
  nestedObj: {
    id: string;
  };
}

const newTestObj: (mod?: number) => TestObjI = (mod) => ({
  string: "Hello World" + mod,
  number: 5 + (mod ?? 0),
  // don't modify falsy
  falsyString: "",
  faslyNumber: 0,
  array: [1, 2, 5, 0, 10].map((val) => val + (mod ?? 0)),
  set: new Set(["I'm", "a", "Set", "" + mod].filter(Boolean)),
  nestedObj: {
    id: "Call me an egg! cus I'm in a nest" + mod,
  },
});

describe("Base Updater logic", () => {
  // might not be used by every test but most of them so might as well define here
  let testDef: jest.Mock<UpdaterDef<TestObjI>>;
  beforeEach(() => {
    testDef = jest.fn();
  });

  describe("basicInputParser", () => {
    it("should return the Response structure for simple input", () => {
      const testVal = "Hello World";
      expect(basicInputParser(testVal)).toEqual([testVal, false]);
    });
    it("should return the passed in Response structure unchanged", () => {
      const testVal = "Hello World";
      expect(basicInputParser([testVal, false])).toEqual([testVal, false]);
      expect(basicInputParser([testVal, true])).toEqual([testVal, true]);
    });
    /**
     * We know that this simple tester will act up if the base structure is an array.
     * Will see how we want to handle that situation later.
     * Will write some failing tests so that if we do fix the behavior they will make sure we update the tests
     */

    it.failing("should handle array types", () => {
      // specifically using length 2 to conflict with the UpdaterResponse
      const testVal: string[] = ["Hello", "world"];

      expect(basicInputParser<string[]>(testVal)).toEqual([testVal, false]);
      expect(basicInputParser<string[]>([testVal, false])).toEqual([
        testVal,
        false,
      ]);
      expect(basicInputParser<string[]>([testVal, true])).toEqual([
        testVal,
        true,
      ]);
    });
  });

  describe("getBuilderObj", () => {
    it("should return default values", () => {
      const builderObj = getBuilderObj();
      expect(builderObj).toEqual({
        inputParser: basicInputParser,
        onChangeFns: [],
      });
    });
    it("should keep passed in parser", () => {
      // just typecasting a random string to the parser type since the function just checks if it exists
      const testParser =
        "I'm definitely a function ;)" as unknown as InputParserFn<TestObjI>;
      const builderObj = getBuilderObj<TestObjI>({
        inputParser: testParser,
      });
      expect(builderObj).toEqual({
        inputParser: testParser,
        onChangeFns: [],
      });
    });
    it("should keep passed in changeFns", () => {
      const testFn: OnChangeFn<TestObjI> = (val) => {
        val;
      };
      const builderObj = getBuilderObj<TestObjI>({
        onChangeFns: [testFn],
      });
      expect(builderObj).toEqual({
        inputParser: basicInputParser,
        onChangeFns: [testFn],
      });
    });
  });

  describe("getUpdaterFromBuilder", () => {
    let builderObj: UpdateBuilderObj<TestObjI>;
    beforeEach(() => {
      builderObj = getBuilderObj();
    });
    it("should return a callable updater", () => {
      const updater = getUpdaterFromBuilder<TestObjI>(testDef, builderObj);
      expect(updater).toBeDefined();
      expect(typeof updater).toBe("function");
      // check other expected keys are defined
      // default builder values:
      expect(updater.inputParser).toBe(basicInputParser);
      expect(updater.onChangeFns).toEqual([]);
      expect(updater.coreInnerFn).toBeDefined();
      expect(updater.innerFn).toBeDefined();
      expect(updater.update).toBeDefined();
    });

    it("should not modify the builderObj", () => {
      const otherBuilder = getBuilderObj<TestObjI>();
      expect(otherBuilder).toEqual(builderObj);
      // we don't care about updater returned for this test
      getUpdaterFromBuilder<TestObjI>(testDef, otherBuilder);
      expect(otherBuilder).toEqual(builderObj);
    });

    it("updater should parse the input and return changes", () => {
      const updater = getUpdaterFromBuilder<TestObjI>(testDef, builderObj);
      const testVal = newTestObj();
      expect(updater(testVal)).toEqual([testVal, false]);
      expect(updater([testVal, false])).toEqual([testVal, false]);
      expect(updater([testVal, true])).toEqual([testVal, true]);
    });
  });

  it("createUpdater builds an updater all at once", () => {
    const updater = createUpdater<TestObjI>(testDef);
    expect(updater).toBeDefined();
    expect(typeof updater).toBe("function");
    // check other expected keys are defined
    // default builder values:
    expect(updater.inputParser).toBe(basicInputParser);
    expect(updater.onChangeFns).toEqual([]);
    expect(updater.coreInnerFn).toBeDefined();
    expect(updater.innerFn).toBeDefined();
    expect(updater.update).toBeDefined();
  });

  describe("makeUpdaterCall wrapper", () => {
    let updater: Updater<TestObjI>;

    beforeEach(() => {
      updater = createUpdater<TestObjI>(testDef);
    });

    const testCases: { input: UpdaterFnInput<TestObjI> }[] = [];

    [undefined, 0, 1, 2].forEach((mod) => {
      const testVal = newTestObj(mod);
      testCases.push(
        { input: testVal },
        { input: [testVal, false] },
        { input: [testVal, true] },
      );
    });

    it.each(testCases)(
      "should wrap updater call without modifying",
      ({ input }) => {
        expect(
          makeUpdaterCall<TestObjI, typeof updater>(updater, input),
        ).toEqual(updater(input));
      },
    );
  });

  describe("updater coreInnerFn", () => {
    let updater: Updater<TestObjI>;
    const testVal = newTestObj();
    beforeEach(() => {
      updater = createUpdater(testDef);
    });

    it("wraps inputFn replacing room argument with a Response tuple", () => {
      // make sure testDef hasn't been called somehow (either bad test setup or createUpdater called it)
      expect(testDef).not.toHaveBeenCalled();
      // simple test Input
      const testInnerInput: UpdaterResponse<TestObjI> = [testVal, false];
      const testArgs = ["a", 12];
      const innerResponse = updater.coreInnerFn(testInnerInput, ...testArgs);
      expect(testDef).toHaveBeenCalledTimes(1);
      // should call the def with just a room and pass along rest of the arguments
      expect(testDef).toHaveBeenCalledWith(testVal, ...testArgs);
      // empty mock should return void/undefined
      expect(testDef).toHaveReturnedWith(undefined);
      // when fn returns undefined/void, should return the input value
      expect(innerResponse).toEqual(testInnerInput);
    });

    it("merges onChange from input and inputFn", () => {
      // This test basically is confirming the fn treats onChange with boolean OR logic

      // default return undefined will return back the input
      expect(updater.coreInnerFn([testVal, false])).toEqual([testVal, false]);
      expect(testDef).toHaveLastReturnedWith(undefined);

      /** Test B = false of OR Table */
      testDef.mockReturnValue([testVal, false]);
      // no change + no change = no change
      expect(updater.coreInnerFn([testVal, false])).toEqual([testVal, false]);
      expect(testDef).toHaveLastReturnedWith([testVal, false]);
      // change + no change = change
      expect(updater.coreInnerFn([testVal, true])).toEqual([testVal, true]);
      // but still returned false
      expect(testDef).toHaveLastReturnedWith([testVal, false]);

      /** Testing B = true */
      testDef.mockReturnValue([testVal, true]);
      // no change + change = change
      expect(updater.coreInnerFn([testVal, false])).toEqual([testVal, true]);
      expect(testDef).toHaveLastReturnedWith([testVal, true]);
      // change + change = change
      expect(updater.coreInnerFn([testVal, true])).toEqual([testVal, true]);
      // but still returned false
      expect(testDef).toHaveLastReturnedWith([testVal, true]);
    });

    it("Use inputFn response room (if there is one)", () => {
      const secondVal = newTestObj(2);
      testDef.mockReturnValue([secondVal, true]);
      // confirm it behaves the same regardless of input onChange
      expect(updater.coreInnerFn([testVal, false])).toEqual([secondVal, true]);
      expect(updater.coreInnerFn([testVal, true])).toEqual([secondVal, true]);
    });

    it("throws error if reporting no changes but different room", () => {
      const secondVal = newTestObj(2);
      testDef
        .mockReturnValueOnce([secondVal, true])
        .mockReturnValueOnce([secondVal, false]);
      // works once with true
      expect(() => {
        updater.coreInnerFn([testVal, false]);
      }).not.toThrow();

      expect(() => {
        updater.coreInnerFn([testVal, false]);
      }).toThrow("no changes occured but returned a new value");
    });
  });

  describe("innerFn calls onChange", () => {
    let updater: Updater<TestObjI>;
    let testOnChangeFns: jest.Mock<OnChangeFn<TestObjI>>[];
    const testVal = newTestObj();
    beforeEach(() => {
      testOnChangeFns = [];
      for (let i = 0; i < 4; i += 1) {
        testOnChangeFns.push(jest.fn());
      }
      //   testOnChangeFns = new Array(4).map((_) => {
      //     return jest.fn();
      //   });
      updater = createUpdater(testDef, {
        onChangeFns: testOnChangeFns,
      });
    });

    it("mock functions setup", () => {
      updater(testVal);
      expect(updater.onChangeFns).toEqual(testOnChangeFns);
      testOnChangeFns.forEach((testChange) => {
        expect(testChange).not.toHaveBeenCalled();
      });
      testOnChangeFns.forEach((fn) => {
        fn(testVal);
      });
      testOnChangeFns.forEach((testFn) => {
        expect(testFn).toHaveBeenCalled();
        expect(testFn).toHaveBeenCalledWith(testVal);
      });
    });

    it("should call all changeFns when coreInnerFn indicates a change", () => {
      testDef.mockImplementation((inputVal) => {
        return [inputVal, true];
      });
      updater(testVal);

      testOnChangeFns.forEach((testFn) => {
        expect(testFn).toHaveBeenCalledTimes(1);
        expect(testFn).toHaveBeenLastCalledWith(testVal);
      });

      const secondTestVal = newTestObj(2);

      updater(secondTestVal);

      testOnChangeFns.forEach((testFn) => {
        expect(testFn).toHaveBeenCalledTimes(2);
        expect(testFn).toHaveBeenLastCalledWith(secondTestVal);
      });
    });
  });

  // this is sorta redundant with other tests so far but best to be thorough
  it("updater calls inputParser", () => {
    const testVal = newTestObj();
    const secondVal = newTestObj(2);
    // parser intentionally returning secondVal instead of inputted val
    const mockInputParser = jest.fn<InputParserFn<TestObjI>>(() => [
      secondVal,
      false,
    ]);
    const updater = createUpdater(testDef, {
      inputParser: mockInputParser,
    });
    updater(testVal);

    expect(mockInputParser).toHaveBeenCalledTimes(1);
    expect(mockInputParser).toHaveBeenCalledWith(testVal);
    expect(mockInputParser).toHaveReturnedWith([secondVal, false]);

    expect(testDef).toHaveBeenCalledTimes(1);
    expect(testDef).toHaveBeenCalledWith(secondVal);
  });

  it("updater.update() should work like updater()", () => {
    const testVal = newTestObj();
    const updater = createUpdater(testDef);
    updater(testVal);
    expect(testDef).toHaveBeenCalledTimes(1);
    expect(testDef).toHaveBeenCalledWith(testVal);

    const secondVal = newTestObj(2);

    updater.update(secondVal);
    expect(testDef).toHaveBeenCalledTimes(2);
    expect(testDef).toHaveBeenLastCalledWith(secondVal);
  });

  describe("copyUpdater", () => {
    let updater: Updater<TestObjI>;
    const placeholderChangeFn: OnChangeFn<TestObjI> = (val) => {
      val;
    };
    beforeEach(() => {
      updater = createUpdater(testDef, {
        onChangeFns: [placeholderChangeFn],
      });
    });

    it("should create a new updater from the original", () => {
      const newUpdater = copyUpdater(updater);
      expect(newUpdater).not.toBe(updater);
      // equality check not working so checking individual values
      expect(newUpdater.onChangeFns).toEqual(updater.onChangeFns);
      expect(newUpdater.inputParser).toEqual(updater.inputParser);
      expect(newUpdater.coreInnerFn).toEqual(updater.coreInnerFn);
      expect(newUpdater.innerFn).toEqual(updater.innerFn);
      expect(newUpdater.update).toEqual(updater.update);
    });

    it("should allow modifying changeFns without altering original", () => {
      const originalChangeFns = [placeholderChangeFn];
      expect(updater.onChangeFns).toEqual(originalChangeFns);
      // copy then modify copies changeFns
      const newUpdater = copyUpdater(updater);
      // casting a string so it's definitely a different value from placeholderChangeFn;
      const definitelyNewChangeFn =
        "a string" as unknown as OnChangeFn<TestObjI>;
      newUpdater.onChangeFns.push(definitelyNewChangeFn);

      expect(newUpdater.onChangeFns).toEqual([
        placeholderChangeFn,
        definitelyNewChangeFn,
      ]);
      // verify origianl updater's unchanged
      expect(updater.onChangeFns).toEqual(originalChangeFns);
    });
  });

  describe("extendUpdater", () => {
    const placeholderChangeFn: OnChangeFn<TestObjI> = (val) => {
      val;
    };
    const secondPlaceholderChange: OnChangeFn<TestObjI> = (val) => {
      val;
    };

    let updater: Updater<TestObjI>;
    beforeEach(() => {
      updater = createUpdater(testDef, {
        onChangeFns: [placeholderChangeFn],
      });
    });

    it("check setup assumptions", () => {
      // making sure two placeholders aren't equal although defined the same
      expect(placeholderChangeFn).not.toEqual(secondPlaceholderChange);
    });

    it("should copy updater and merge builder", () => {
      // make sure updater values are as expected before the copy
      expect(updater.onChangeFns).toEqual([placeholderChangeFn]);
      expect(updater.inputParser).toEqual(basicInputParser);
      // new parser (although functionally the same for simplicity)
      const newParser: InputParserFn<TestObjI> = (input) => {
        return basicInputParser(input);
      };
      expect(newParser).not.toEqual(basicInputParser);
      const newUpdater = extendUpdater(updater, {
        inputParser: newParser,
        onChangeFns: [secondPlaceholderChange],
      });
      expect(newUpdater).not.toBe(updater);
      // confirm changes happened
      expect(newUpdater.onChangeFns).toEqual([
        placeholderChangeFn,
        secondPlaceholderChange,
      ]);
      expect(newUpdater.inputParser).toEqual(newParser);
      // confirm original updater's values are unchanged
      expect(updater.onChangeFns).toEqual([placeholderChangeFn]);
      expect(updater.inputParser).toEqual(basicInputParser);
      // check all other values are the same
      // equality check not working so checking individual values
      expect(newUpdater.coreInnerFn).toEqual(updater.coreInnerFn);
      expect(newUpdater.innerFn).toEqual(updater.innerFn);
      expect(newUpdater.update).toEqual(updater.update);
    });

    it("should work with just parser defined", () => {
      // new parser (although functionally the same for simplicity)
      const newParser: InputParserFn<TestObjI> = (input) => {
        return basicInputParser(input);
      };
      expect(newParser).not.toEqual(basicInputParser);
      const newUpdater = extendUpdater(updater, {
        inputParser: newParser,
      });
      expect(newUpdater).not.toBe(updater);
      // confirm changes happened
      expect(newUpdater.inputParser).toEqual(newParser);
      // confirm original updater's values are unchanged
      expect(updater.inputParser).toEqual(basicInputParser);
      // check all other values are the same
      // equality check not working so checking individual values
      expect(newUpdater.onChangeFns).toEqual(updater.onChangeFns);
      expect(newUpdater.coreInnerFn).toEqual(updater.coreInnerFn);
      expect(newUpdater.innerFn).toEqual(updater.innerFn);
      expect(newUpdater.update).toEqual(updater.update);
    });

    it("should work without parser defined", () => {
      // making a new updater to start with a parser that isn't the default value
      const newParser: InputParserFn<TestObjI> = (input) => {
        return basicInputParser(input);
      };
      expect(newParser).not.toEqual(basicInputParser);
      const useUpdater = createUpdater(testDef, {
        inputParser: newParser,
        onChangeFns: [placeholderChangeFn],
      });
      // make sure updater values are as expected before the copy
      expect(useUpdater.inputParser).toEqual(newParser);

      const newUpdater = extendUpdater(useUpdater, {
        onChangeFns: [secondPlaceholderChange],
      });
      expect(newUpdater).not.toBe(useUpdater);
      // confirm changes happened
      expect(newUpdater.onChangeFns).toEqual([
        placeholderChangeFn,
        secondPlaceholderChange,
      ]);
      // confirm original updater's values are unchanged
      expect(useUpdater.onChangeFns).toEqual([placeholderChangeFn]);
      expect(useUpdater.inputParser).toEqual(newParser);
      // check all other values are the same
      // equality check not working so checking individual values
      expect(newUpdater.inputParser).toEqual(useUpdater.inputParser);
      expect(newUpdater.coreInnerFn).toEqual(useUpdater.coreInnerFn);
      expect(newUpdater.innerFn).toEqual(useUpdater.innerFn);
      expect(newUpdater.update).toEqual(useUpdater.update);
    });
  });

  describe("createUpdateBuilder", () => {
    // define a builder that will make sure that it adds to default updaters when extending
    let firstBuilder: UpdateBuilderObj<TestObjI>;
    const newParser: InputParserFn<TestObjI> = (input) => {
      return basicInputParser(input);
    };
    const testChangeFn = jest.fn<OnChangeFn<TestObjI>>();
    beforeEach(() => {
      firstBuilder = getBuilderObj({
        inputParser: newParser,
        onChangeFns: [testChangeFn],
      });
    });

    it("should return 3 builder functions", () => {
      const updateBuilder = createUpdaterBuilder(firstBuilder);
      const expectedKeys = [
        "createUpdater",
        "extendUpdater",
        "mapExtendUpdaters",
      ] as (keyof ReturnType<typeof createUpdaterBuilder>)[];
      // since order doesn't matter, wrap each array in a set
      expect(new Set(Object.keys(updateBuilder))).toEqual(
        new Set(expectedKeys),
      );

      expectedKeys.forEach((key) => {
        expect(typeof updateBuilder[key]).toBe("function");
      });
    });

    it("createUpdater should make a new updater with builder values", () => {
      const updateBuilder = createUpdaterBuilder(firstBuilder);
      const updater = updateBuilder.createUpdater(testDef);
      // make sure updater values defined with expected builder values (rather than the defaults)
      expect(updater.inputParser).toBe(newParser);
      expect(updater.onChangeFns).toEqual([testChangeFn]);
      expect(updater.coreInnerFn).toBeDefined();
      expect(updater.innerFn).toBeDefined();
      expect(updater.update).toBeDefined();
    });

    it("extendUpdater should extend an updater with builder values", () => {
      const updater = createUpdater(testDef);
      // confirm default values
      expect(updater.inputParser).toBe(basicInputParser);
      expect(updater.onChangeFns).toEqual([]);

      const updateBuilder = createUpdaterBuilder(firstBuilder);
      // create the extended updater
      const extendedUpdater = updateBuilder.extendUpdater(updater);
      // make sure updater values defined with expected builder values (rather than the defaults)
      expect(extendedUpdater.inputParser).toBe(newParser);
      expect(extendedUpdater.onChangeFns).toEqual([testChangeFn]);
      expect(extendedUpdater.coreInnerFn).toBe(updater.coreInnerFn);
      expect(extendedUpdater.innerFn).toBe(updater.innerFn);
      expect(extendedUpdater.update).toBe(updater.update);
    });

    it("mapExtendUpdater copies a record while extending it", () => {
      const updater = createUpdater(testDef);
      const secondDef = jest.fn<UpdaterDef<TestObjI>>();
      expect(secondDef).not.toEqual(testDef);
      const secondUpdater = createUpdater(secondDef);

      const updaterObj = {
        onMainAction: updater,
        secondaryAction: secondUpdater,
      };
      const objKeys: (keyof typeof updaterObj)[] = [
        "onMainAction",
        "secondaryAction",
      ];
      expect(new Set(objKeys)).toEqual(new Set(Object.keys(updaterObj)));

      const updateBuilder = createUpdaterBuilder(firstBuilder);

      function compareUpdaters(original: Updater, extended: Updater) {
        expect(original.inputParser).toBe(basicInputParser);
        expect(extended.inputParser).toBe(newParser);
        expect(original.onChangeFns).toEqual([]);
        expect(extended.onChangeFns).toEqual([testChangeFn]);
        expect(extended.coreInnerFn).toBe(original.coreInnerFn);
        expect(extended.innerFn).toBe(original.innerFn);
        expect(extended.update).toBe(original.update);
      }

      const newUpdaterObj = updateBuilder.mapExtendUpdaters(updaterObj);

      // make sure object keys are same
      expect(new Set(Object.keys(newUpdaterObj))).toEqual(
        new Set(Object.keys(updaterObj)),
      );

      objKeys.forEach((key) => {
        compareUpdaters(updaterObj[key], newUpdaterObj[key]);
      });
    });
  });
});
