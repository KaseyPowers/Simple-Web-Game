// store should be static resource of all the pieces in the game. but will allow adding new values just in case

import type { UniquePiece, IDKeys } from "./types";

// core store logic, can be extended with specific application in mind
export abstract class BasePiecesStore<T, ID> {
  private readonly store = new Map<ID, T>();
  abstract getPieceId(from: T): ID;

  getById(id: ID): T | undefined {
    return this.store.get(id);
  }

  // NOTE: should it throw error if piece doesn't exist?
  removeId(id: ID) {
    this.store.delete(id);
  }
  removeIds(ids: ID[]) {
    ids.forEach((id) => this.removeId(id));
  }
  removePiece(obj: T) {
    const id = this.getPieceId(obj);
    this.removeId(id);
  }
  removePieces(toRemove: T[]) {
    toRemove.forEach((piece) => this.removePiece(piece));
  }
  // adds item to the store, throwing an error if it's already added.
  addPiece(obj: T) {
    const id = this.getPieceId(obj);
    if (this.store.has(id)) {
      throw new Error(`Store already has a piece with this ID ${id + ""}`);
    }
    this.store.set(id, obj);
  }

  addPieces(toAdd: T[]) {
    toAdd.forEach((piece) => this.addPiece(piece));
  }

  // simple equality for the `tryAddPiece` function, does a shallow object test by default but can be modified if needed
  piecesMatch(a: T, b: T): boolean {
    // if they are the same reference, easy true
    if (a === b) {
      return true;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    // get all keys remove duplicates
    const allKeys = [...new Set([...aKeys, ...bKeys])];
    // if allKeys has a different length, meants they had different values
    if (allKeys.length !== aKeys.length) {
      return false;
    }
    // now do a shallow equality check by comparing the values at each key
    return allKeys.every((key) => a[key] === b[key]);
  }
  // like adding a piece but when there is a chance the object has already been added (instead throw an error if the object doesn't match)
  tryAddPiece(obj: T) {
    const id = this.getPieceId(obj);
    if (this.store.has(id)) {
      const current = this.store.get(id)!;
      if (!this.piecesMatch(obj, current)) {
        throw new Error(
          `Tried adding piece to store with an existing ID, but the new piece is different from the stored one`,
        );
      }
    }
    this.store.set(id, obj);
  }

  tryAddPieces(toAdd: T[]) {
    toAdd.forEach((piece) => this.tryAddPiece(piece));
  }

  get allIds(): ID[] {
    return Array.from(this.store.keys());
  }
  get allPieces(): T[] {
    return Array.from(this.store.values());
  }

  constructor(initialData?: T[]) {
    if (initialData) {
      this.addPieces(initialData);
    }
  }
}

// default functional store, uses a constructor argument to provide the missing obj => id logic
export class PiecesStore<T, ID> extends BasePiecesStore<T, ID> {
  getPieceId: (from: T) => ID;
  constructor(getId: IDKeys<T, ID> | ((from: T) => ID), initialData?: T[]) {
    // don't give data to parent constructor since it uses the getPieceId function which hasn't been defined yet
    super();
    if (typeof getId === "function") {
      this.getPieceId = getId;
    } else if (typeof getId === "string") {
      this.getPieceId = (from) => from[getId] as ID;
    } else {
      throw new Error("No valid getID provided");
    }
    // add data
    if (initialData) {
      this.addPieces(initialData);
    }
  }
}

// More specific functional default, based on the UniquePiece interface that assumes "id" key will be the unique identifier
export class IDPiecesStore<
  T extends UniquePiece<ID>,
  ID,
> extends BasePiecesStore<T, ID> {
  getPieceId(from: T) {
    return from.id;
  }
}

export function withInputType<
  Type,
  InputType,
  ID,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BaseClass extends abstract new (...args: any[]) => BasePiecesStore<Type, ID>,
>(baseClass: BaseClass, fromInput: (input: InputType) => Type) {
  abstract class WithInput extends baseClass {
    fromInputPiece = fromInput;

    // if following this pattern for all functions that take an obj, we should have `removeInput` but I think we should leave the remove functions to ones with an ID or a full object

    addInput(input: InputType) {
      this.addPiece(this.fromInputPiece(input));
    }
    addInputs(toAdd: InputType[]) {
      toAdd.forEach((input) => this.addInput(input));
    }
    tryAddInput(input: InputType) {
      this.tryAddPiece(this.fromInputPiece(input));
    }
    tryAddInputs(toAdd: InputType[]) {
      toAdd.forEach((input) => this.tryAddInput(input));
    }
  }
  return WithInput;
}
