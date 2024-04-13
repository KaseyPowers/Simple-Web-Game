import type {
  GameDataType,
  GameDataTypeObj,
  BaseGameDataType,
  ExternalDataType,
} from "./types";
import { GameData } from "./classes";

export function copyData<Type extends GameDataType>(input: Type): Type {
  // if copying data that includes a class, return a copy of the class not just it's data
  if (input instanceof GameData) {
    return GameData.copy(input);
  }
  if (Array.isArray(input)) {
    return input.map((childVal) => copyData(childVal)) as Type;
  }
  // return primative types
  if (
    input === null ||
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "boolean" ||
    typeof input === "undefined"
  ) {
    return input;
  }

  return Object.keys(input).reduce((output, key) => {
    const val = input[key];
    output[key] = copyData(val);
    return output;
  }, {} as GameDataTypeObj) as Type;
}

export function getData(input: GameDataType): ExternalDataType<typeof input> {
  if (input instanceof GameData) {
    return input.getData();
  }

  if (Array.isArray(input)) {
    return input.map((childVal) => getData(childVal));
  }
  // return primative types
  if (
    input === null ||
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "boolean" ||
    typeof input === "undefined"
  ) {
    return input;
  }

  return Object.keys(input).reduce((output, key) => {
    const val = input[key];
    output[key] = getData(val);
    return output;
  }, {} as ExternalDataType<GameDataTypeObj>);
}

// instead of a new class, just a wrapper around the derived function that memoizes it.
export function memoizedGameData<T extends BaseGameDataType>(
  gameData: GameData<T>,
) {
  const originalDerived = gameData.getDerived.bind(gameData);
  const derivedValuesMap = new Map<
    Parameters<typeof originalDerived>,
    ReturnType<typeof originalDerived>
  >();
  gameData.getDerived = (...args: Parameters<typeof originalDerived>) => {
    if (!derivedValuesMap.has(args)) {
      derivedValuesMap.set(args, originalDerived(...args));
    }
    // ! non-null assertion to tell TS we know it's defined
    return derivedValuesMap.get(args)!;
  };
}
