export type UUID = string;

export type ObjectValues<T> = T[keyof T];

export interface BaseUUIDItem {
    id: UUID
};
export type NormalizedState<T extends BaseUUIDItem> = {
    byId: { [key: UUID]: T },
    allIds: UUID[],
}