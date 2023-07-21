import { BaseUUIDItem, NormalizedState } from "./types";

export function createNormalized<T extends BaseUUIDItem>(items: T[]): NormalizedState<T> {
    const output: NormalizedState<T> = {
        byId: {},
        allIds: []
    };
    items.forEach(item => {
        output.byId[item.id] = item;
        output.allIds.push(item.id);
    });
    return output;
}