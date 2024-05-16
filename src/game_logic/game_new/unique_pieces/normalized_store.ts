import type { GetIDFn } from "./types";

export type NormalizedStoreOptions<T, ID> = {
  idFn: GetIDFn<T, ID>;
} & (
  | {
      allowDuplicates?: false;
    }
  | {
      allowDuplicates: true;
      isEqual: (a: T, b: T) => boolean;
    }
);

export type NormalizedStoreI<T, ID> = {
  allIds: string[];
  getByID: (id: string | ID) => T | undefined;
};

export function storeToArray<T>(store: NormalizedStoreI<T, unknown>): T[] {
  const { allIds, getByID } = store;
  return allIds.map((id) => getByID(id) as T);
}

// relying on array.join to handle the stringification of thing
function toIDString<T>(input: T) {
  return ([] as unknown[]).concat(input).join("-");
}

export function createNormalizedStore<T, ID>(
  items: T[],
  { idFn, ...rest }: NormalizedStoreOptions<T, ID>,
): Readonly<NormalizedStoreI<T, string>> {
  const allIds: string[] = [];
  const store: Record<string, T> = {};

  function idInStore(key: PropertyKey): key is keyof typeof store {
    return Object.prototype.hasOwnProperty.call(store, key);
  }

  items.forEach((item) => {
    // wrap idFn in a fn to make sure it's a string
    const id = toIDString(idFn(item));
    // check if id already exists, handle potential errors as needed
    if (idInStore(id)) {
      if (rest.allowDuplicates) {
        const currentVal = store[id] as T;
        if (!rest.isEqual(item, currentVal)) {
          throw new Error(
            "Found duplicate ID, which is allowed, but the two items are not equal according to the isEqual fn used",
          );
        }
      } else {
        throw new Error("Found a duplicate id when allowDuplicates is false");
      }
    } else {
      // if not in store, add it now
      store[id] = item;
    }
    // add id to the array tracking
    // NOTE: we could use the map's .keys() fn for ids, but if we allow duplicates they would be lost
    allIds.push(id);
  });

  return {
    allIds,
    getByID: (id) => store[toIDString(id)],
  };
}

export function buildNormalizedStore<InputType, Type, ID>(
  inputItems: InputType[],
  {
    fromInput,
    ...rest
  }: NormalizedStoreOptions<Type, ID> & {
    fromInput: (input: InputType) => Type;
  },
) {
  const items = inputItems.map((input) => fromInput(input));

  return createNormalizedStore(items, { ...rest });
}
