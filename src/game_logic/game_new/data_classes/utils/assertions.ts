import type { DataType, InnerDataType, DataTypePrimatives } from "../types";

// export type DataTypePrimatives = string | number | boolean | null | undefined;
export function isDataTypePrimative(
  input: DataType,
): input is DataTypePrimatives {
  return (
    input === null ||
    ["string", "number", "boolean", "underfined"].includes(typeof input)
  );
}

// shoutout to stack overlfow for this: https://stackoverflow.com/a/7478166
// NOTE: This might be overkill or miss something? Time will tell
export function isDataTypeRecord(
  input: DataType,
): input is Record<string, DataType> {
  return typeof input == "object" && toString.call(input) == "[object Object]";
}
