/** ID type, what is returned by redux nanoid, but keeping it string directly in case we change later */
export type UUID = string;

export interface BaseUUIDItem {
    id: UUID
};
export type NormalizedState<T extends BaseUUIDItem> = {
    byId: { [key: UUID]: T },
    allIds: UUID[],
}

/** make some keys required as needed */
export type PartRequired<T extends Object, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Make some keys partial */
export type PartPartial<T extends Object, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** This will take a Type, remove selected keys and make others optional */
export type MakeInputType<T extends Object, RemoveKeys extends keyof T, OptionalKeys extends keyof T> = Omit<T, RemoveKeys | OptionalKeys> & Partial<Pick<T, OptionalKeys>>;

export type ObjectValues<T> = T[keyof T];
export type ObjectKeys<T> = keyof T;