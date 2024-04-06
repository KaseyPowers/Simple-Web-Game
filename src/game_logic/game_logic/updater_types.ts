/* eslint-disable @typescript-eslint/no-explicit-any */

import type { PartialExcept } from "~/utils/types";

// Base Response type
export type UpdaterResponse<Type> = [Type, boolean];
// the definition function used to create the updater
export type UpdaterDef<Type, Args extends any[] = any[]> = (
  input: Type,
  ...args: Args
) => UpdaterResponse<Type> | undefined | void;
// Inner function used that takes + returns the response type
export type UpdaterInner<Type, Args extends any[] = any[]> = (
  input: UpdaterResponse<Type>,
  ...args: Args
) => UpdaterResponse<Type>;

export type UpdaterFnInput<Type, OtherInputs = undefined> =
  | Type
  | UpdaterResponse<Type>
  | (OtherInputs extends undefined ? never : OtherInputs);

export type InputParserFn<Type, OtherInputs = undefined> = (
  input: UpdaterFnInput<Type, OtherInputs>,
) => UpdaterResponse<Type>;

export type OnChangeFn<Type> = (newValue: Type) => void;

export type UpdateBuilderObj<Type, OtherInputs = undefined> = {
  readonly inputParser: InputParserFn<Type, OtherInputs>;
  readonly onChangeFns: OnChangeFn<Type>[];
};

export type UpdateBuilderOptions<
  Type,
  OtherInputs = undefined,
> = OtherInputs extends undefined
  ? Partial<UpdateBuilderObj<Type, OtherInputs>>
  : PartialExcept<UpdateBuilderObj<Type, OtherInputs>, "inputParser">;

export type UpdaterFn<
  Type,
  Args extends any[] = any[],
  OtherInputs = undefined,
> = (
  input: UpdaterFnInput<Type, OtherInputs>,
  ...args: Args
) => UpdaterResponse<Type>;

export interface UpdaterObj<
  Type,
  Args extends any[] = any[],
  OtherInputs = undefined,
> extends UpdateBuilderObj<Type, OtherInputs> {
  // inner functions to leave alone
  readonly coreInnerFn: UpdaterInner<Type, Args>;
  readonly innerFn: UpdaterInner<Type, Args>;
  // the main function to expose
  readonly update: UpdaterFn<Type, Args, OtherInputs>;
}

export type Updater<
  Type = any,
  Args extends any[] = any[],
  OtherInputs = undefined,
> = UpdaterFn<Type, Args, OtherInputs> & UpdaterObj<Type, Args, OtherInputs>;

export type GetUpdaterType<T extends Updater> =
  T extends Updater<infer Type, any, any> ? Type : never;

export type GetUpdaterArgs<T extends Updater> =
  T extends Updater<any, infer Args, any> ? Args : never;

export type GetUpdaterOtherInputs<T extends Updater> =
  T extends Updater<any, any, infer OtherInputs> ? OtherInputs : never;

export type GetUpdaterInputType<T extends Updater> =
  T extends Updater<infer Type, any, infer OtherInputs>
    ? UpdaterFnInput<Type, OtherInputs>
    : never;

export type GetUpdaterParameters<T extends Updater> = [
  input: GetUpdaterInputType<T>,
  ...args: GetUpdaterArgs<T>,
];

export type ConvertUpdaterType<
  FromUpdater extends Updater = Updater,
  NewOtherInputs = undefined,
> =
  FromUpdater extends Updater<infer Type, infer Args, any>
    ? Updater<Type, Args, NewOtherInputs>
    : never;

export type MapToNewUpdater<
  Type,
  ToConvert extends Record<string, Updater<Type>> = Record<
    string,
    Updater<Type>
  >,
  NewOtherInputs = undefined,
  KeepKeys extends keyof ToConvert = keyof ToConvert,
> = {
  [Property in KeepKeys]: ConvertUpdaterType<
    ToConvert[Property],
    NewOtherInputs
  >;
};
