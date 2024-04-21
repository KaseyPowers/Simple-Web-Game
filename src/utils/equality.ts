// simple equality, only checking shallow values being equal
export function arrayEqual<T>(a: T[], b: T[]): boolean {
  return (
    a === b ||
    (a.length === b.length && a.every((val, index) => val === b[index]))
  );
}
