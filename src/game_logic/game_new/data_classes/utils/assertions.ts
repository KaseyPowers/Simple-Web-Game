export type Primatives = null | string | number | boolean | undefined;
export function isPrimative(input: any): input is Primatives {
  return (
    input === null ||
    ["string", "number", "boolean", "underfined"].includes(typeof input)
  );
}

// shoutout to stack overlfow for this: https://stackoverflow.com/a/7478166
// NOTE: This might be overkill or miss something? Time will tell
export function isRecord(input: any): input is Record<string, any> {
  return typeof input == "object" && toString.call(input) == "[object Object]";
}
