/* eslint-disable @typescript-eslint/no-explicit-any */
type GetOption<T> = T extends readonly any[] ? T[number] : never;

export type OptionsObj = Record<string, readonly any[]>;
// Type converts an object of const options into a piece type
export type PieceFromOptions<T> = {
  [K in keyof T as T[K] extends readonly any[] ? K : never]: GetOption<T[K]>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export function allOptions<T extends OptionsObj>(
  input: T,
): PieceFromOptions<T>[] {
  // should grab all the keys that are tied to an array.
  // const optionKeys = Object.keys(input).filter(key =>  Array.isArray(input[key]));

  function addKeyValues(key: keyof T, currentOutput: PieceFromOptions<T>[]) {
    const values = input[key];
    if (!Array.isArray(values) || values.length <= 0) {
      return currentOutput;
    }
    const nextOutput: PieceFromOptions<T>[] = [];
    values.forEach((val) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const toAdd = { [key]: val };
      nextOutput.push(
        ...((currentOutput.length > 0
          ? currentOutput.map((current) => ({ ...current, ...toAdd }))
          : [toAdd]) as PieceFromOptions<T>[]),
      );
    });
    return nextOutput;
  }

  let output: PieceFromOptions<T>[] = [];
  Object.keys(input).forEach((key) => {
    output = addKeyValues(key, output);
  });

  return output;
}
