type KeyValExpand<T> = T extends unknown[]
  ? never
  : T extends object
    ? {
        [K in keyof T]:
          | [K, T[K]]
          | (T[K] extends object ? [K, ...KeyValExpand<T[K]>] : never);
      }[keyof T]
    : [T];

function setValue<T extends object>(obj: T, ...args: KeyValExpand<T>) {
  if (args.length < 1) {
    throw new Error("whoops messed up");
  }
  if (args.length === 1) {
    obj = args[0] as T;
  }
  if (args.length === 2) {
    const [key, value] = args as [keyof T, T[keyof T]];
    obj[key] = value;
  }
  if (args.length > 2) {
    // if deeper, will call recursively
    const [key, ...rest] = args;
    const next = obj[key as keyof T] ?? ({} as T[keyof T]);
    setValue<T[keyof T]>(next, ...rest);
    obj[key] = next;
  }
  return obj;
}
