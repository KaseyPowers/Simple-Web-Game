import type { Draft, Producer, Immutable } from "immer";
import { freeze } from "immer";
import type {
  MaybeFromFn,
  FnReturns,
  IsStringNotEmpty,
  IfStringLiteral,
  IfNotEmptyObj,
  IsOnlyStringLiteral,
  StrictPrefixRemap,
  IsMaybeVoid,
  AnyFunction,
  IfStringNotEmpty,
} from "~/utils/types";

// action function takes draft and manipulates it
type ActionFn<S, P, M> = (
  draft: Draft<S>,
  payload: P,
  meta: M,
) => ReturnType<Producer<S>>;
// Action function with optional other helper fields. When I think of them
// type ActionDef<State, Payload, Meta> = ActionFn<State, Payload, Meta>;
//  & {
//   prepare?:
// }

// util actions act like actions but can return extra details
type UtilAction<S, P, M, R extends unknown[]> = (
  ...args: Parameters<ActionFn<S, P, M>>
) => [...R, response: ReturnType<ActionFn<S, P, M>>];

/**
 * Slice behavior:
 *
 * // root-base behaviors
 * onEvent: input new events, to potentially update state
 * onChange: listener for state change (base/default/entry-point)
 *
 * // shared utilities
 * didChange: (previousState, nextState) => boolean; // checker if things changed. I believe immer results should mean === or Object.is checks will work (if so, this might not be needed, but can be used if we only care about changes in a subset of the state?)
 *
 *
 * // child-slice utility
 * getData<Memoized>: (root/parentData) => sliceData
 *
 * // utility behaviors
 *
 * // perform a specific change to the data, ex. called by onEvent or by other actions
 * // Thought: could use some wrapping behavior to prevent actions from being called more than once per change-entry point?
 * onActionFns: (sliceState: Draft<State>, payload: any, meta: any, root: Immutable<Root/ParentState>)
 *
 * utilityActions: like actions, but can return things as well as modify state. return type: [...others: any[], actionReturnType]
 *
 * utilities: catch all for any other useful functions that should be defined.
 *
 *
 * // Derived Data structure(s)
 * DerivedTypes:
 * - "none": Default if not specified, means this type shouldn't be exposed to client at all, (or can be used with others to indicate that the public/minimum state is not exposing anything)
 * - "public" OR "min": Default/required for exposed data, what is available to anyone (ex. game observers), minimum exposed data
 * - "max": Useful pairing with "public"/"minimum", for the most detail to reveal
 * - custom (string): any other types expected
 *
 * `get${DerivedType string (if not "none")}Derived`<Memoized>: (state) =>  DerivedState
 *
 */
type ActionsMapDef<State> = Record<string, ActionFn<State, unknown, unknown>>;
// actually convert string to template: `get${Capitalize<Str>}DerivedState`
type ToDerivedFnStr<Str extends string> = Str extends ""
  ? never
  : Str extends `get${infer I}`
    ? GetDerivedFnStr<I>
    : Str extends `${infer I}State`
      ? GetDerivedFnStr<I>
      : Str extends `${infer I}Derived`
        ? GetDerivedFnStr<I>
        : `get${Capitalize<Str>}DerivedState`;
// wrap with check for string literal, becomes recursive
type GetDerivedFnStr<Type> = ToDerivedFnStr<IfStringNotEmpty<Type>>;

type DerivedTypesMap = Record<string, unknown>;

type DerivedTypesFns<State, DerivedTypes extends DerivedTypesMap> = {
  [K in keyof DerivedTypes as GetDerivedFnStr<K>]: <Meta = void>(
    input: State,
    meta: Meta,
  ) => DerivedTypes[K];
};

/* eslint-disable @typescript-eslint/ban-types */
type SliceDef<
  Name extends string,
  State,
  Actions extends ActionsMapDef<State> | void = void,
  DerivedTypes extends DerivedTypesMap | void = void,
> = {
  name: Name;
  getInitialState(): State;
  getState(): State;
  utils?: Record<string, AnyFunction>;
  actionUtils?: Record<string, UtilAction<State, unknown, unknown, unknown[]>>;
} & (Actions extends ActionsMapDef<State>
  ? StrictPrefixRemap<Actions, "on">
  : {}) &
  (DerivedTypes extends DerivedTypesMap
    ? DerivedTypesFns<State, DerivedTypes>
    : {});

type StateFromInput<
  SliceState,
  InjectSlices extends InjectSliceInput | void = void,
> = SliceState &
  (InjectSlices extends InjectSliceInput
    ? StateFromInjectInput<InjectSlices>
    : {});
/* eslint-enable @typescript-eslint/ban-types */

type SliceDefFromInject<
  Name extends string,
  SliceState = unknown,
  InjectSlices extends InjectSliceInput | void = void,
  Actions extends ActionsMapDef<
    StateFromInput<SliceState, InjectSlices>
  > | void = void,
  DerivedTypes extends DerivedTypesMap | void = void,
> = SliceDef<
  Name,
  StateFromInput<SliceState, InjectSlices>,
  Actions,
  DerivedTypes
>;

/* eslint-disable @typescript-eslint/no-explicit-any */
type UnknownSlice = SliceDef<string, any, any, any>;
// type UnknownSlice = SliceDef<unknown, unknown, unknown>;

type InjectSliceOptionBase<Slice extends UnknownSlice = UnknownSlice> =
  | Slice
  | Array<Slice>
  | Record<string, Slice>;

type GetStateFromBase<Base extends InjectSliceOptionBase> =
  Base extends SliceDef<string, infer State, any, any>
    ? State
    : Base extends Record<string, infer Slice>
      ? Slice extends SliceDef<string, infer State, any, any>
        ? Record<string, State>
        : never
      : Base extends Array<infer Slice>
        ? Slice extends SliceDef<string, infer State, any, any>
          ? Array<State>
          : never
        : never;

type InjectSliceOption<Slice extends UnknownSlice = UnknownSlice> =
  | InjectSliceOptionBase<Slice>
  | [string, InjectSliceOptionBase<Slice>];

type _GetKeyFromInjectOption<Option extends InjectSliceOption> =
  Option extends [infer Key, InjectSliceOptionBase]
    ? Key
    : Option extends InjectSliceOptionBase<infer Slice>
      ? Slice extends SliceDef<infer Key, unknown, any, any>
        ? Key
        : never
      : never;
/* eslint-enable @typescript-eslint/no-explicit-any */
type GetKeyFromInjectOption<Option extends InjectSliceOption> =
  IfStringNotEmpty<_GetKeyFromInjectOption<Option>>;

type GetStateFromInjectOption<Option extends InjectSliceOption> =
  Option extends InjectSliceOptionBase
    ? GetStateFromBase<Option>
    : Option extends [string, infer Base]
      ? Base extends InjectSliceOptionBase
        ? GetStateFromBase<Base>
        : never
      : never;

type StateFromSliceOptions<Option extends InjectSliceOption> = Record<
  GetKeyFromInjectOption<Option>,
  GetStateFromInjectOption<Option>
>;

type InjectSliceInput<Slice extends UnknownSlice = UnknownSlice> = Array<
  InjectSliceOption<Slice>
>;

type StateFromInjectInput<Input extends InjectSliceInput> =
  Input extends Array<infer Options>
    ? Options extends InjectSliceOption
      ? StateFromSliceOptions<Options>
      : never
    : never;

/**
 * - name
 * - initialState,
 * - injectSlices?:
 * - utils?:
 * - actions?:
 * - actionUtils?:
 * - derivedFns?:
 * 
 * type SliceDef<
  Name extends string,
  State,
  Actions extends ActionsMapDef<State> | void = void,
  DerivedTypes extends DerivedTypesMap | void = void,
>
 */

type BaseSliceOptions<Name extends string, State> = {
  name: Name;
  initialState: MaybeFromFn<State>;
  utils?: Record<string, AnyFunction>;
};
/* eslint-disable @typescript-eslint/ban-types */
type SliceOptionAddons<
  State,
  Actions extends ActionsMapDef<State> | void = void,
  DerivedTypes extends DerivedTypesMap | void = void,
> = {
  actionUtils?: Record<string, UtilAction<State, unknown, unknown, unknown[]>>;
} & (Actions extends ActionsMapDef<State>
  ? {
      actions: Actions;
    }
  : {}) &
  (DerivedTypes extends DerivedTypesMap
    ? {
        derived: DerivedTypesFns<State, DerivedTypes>;
      }
    : {});

type SliceOptions<
  Name extends string,
  State,
  Actions extends ActionsMapDef<State> | void = void,
  DerivedTypes extends DerivedTypesMap | void = void,
> = BaseSliceOptions<Name, State> &
  SliceOptionAddons<State, Actions, DerivedTypes>;

type SliceInjectOptions<
  Name extends string,
  SliceState = unknown,
  InjectSlices extends InjectSliceInput | void = void,
  Actions extends ActionsMapDef<
    StateFromInput<SliceState, InjectSlices>
  > | void = void,
  DerivedTypes extends DerivedTypesMap | void = void,
> = BaseSliceOptions<Name, SliceState> &
  (InjectSlices extends InjectSliceInput
    ? {
        injectSlices: InjectSlices;
      }
    : {}) &
  SliceOptionAddons<
    StateFromInput<SliceState, InjectSlices>,
    Actions,
    DerivedTypes
  >;

/* eslint-enable @typescript-eslint/ban-types */

export function createSlice<
  Name extends string,
  SliceState,
  Actions extends ActionsMapDef<SliceState> | void = void,
  DerivedTypes extends DerivedTypesMap | void = void,
>(
  options: SliceOptions<Name, SliceState, Actions, DerivedTypes>,
): SliceDef<Name, SliceState, Actions, DerivedTypes>;

export function createSlice<
  Name extends string,
  SliceState = unknown,
  InjectSlices extends InjectSliceInput | void = void,
  Actions extends ActionsMapDef<
    StateFromInput<SliceState, InjectSlices>
  > | void = void,
  DerivedTypes extends DerivedTypesMap | void = void,
>(
  options: SliceInjectOptions<
    Name,
    SliceState,
    InjectSlices,
    Actions,
    DerivedTypes
  >,
): SliceDefFromInject<Name, SliceState, InjectSlices, Actions, DerivedTypes>;

export function createSlice({
  name,
  initialState,
  // injectSlices,
  actions,
  utils,
  actionUtils,
  derived,
}: {
  name: string;
  initialState: MaybeFromFn<unknown>,
  // injectSlices?: InjectSliceInput,
}) {
  function initialFromFn(val: MaybeFromFn<unknown>): val is FnReturns<unknown> {
    return (typeof val === "function");
  }

  const initial = freeze(initialFromFn(initialState) ? initialState() : initialState, true);


  return {
    name,
    getInitialState: () => initial,
  };
}

// type SliceInput<State, DerivedTypes extends DerivedTypesMap | void> = {
//   name: string;
//   initialState: MaybeFromFn<State>;
// } & [void] extends [DerivedTypes]
//   ? DerivedTypesFns<State, DerivedTypes>
//   : {};

// function createSlice<Name extends string, State>({}): BaseSliceDef<State> {}

export abstract class SliceDefBaseClass extends SliceDef<string, unknown, unknown, unknown>  {

}

// export abstract class SliceDefBase<State> {
//   // used as default for parent path
//   protected readonly name?: string;
//   // parent references if not root-slice
//   private readonly parent?: undefined | SliceDef<unknown> = undefined;
//   private readonly parentPath?: undefined | null | string = undefined;
//   // keys for the state, used to reserve part of the parent state if parentPath is null/undefined
//   private readonly reserveKeys?: (keyof State)[];

//   constructor(
//     fromParent?:
//       | SliceDef<unknown>
//       | [SliceDef<unknown>]
//       | [SliceDef<unknown>, undefined | null | string],
//   ) {
//     // If a name is provided, use it as the default value for parent path
//     if (this.name) {
//       this.parentPath = this.name;
//     }
//     if (fromParent) {
//       if (fromParent instanceof SliceDef) {
//         this.parent = fromParent;
//       } else {
//         const [parent, path] = fromParent;
//         if (parent instanceof SliceDef) {
//           this.parent = parent;
//         } else {
//           throw new Error("Expected parent to be an instance of SliceDef");
//         }
//         // validate incoming path
//         if (!path && typeof path === "string") {
//           throw new Error(
//             "Parent Path was an empty string, which isn't allowed. Must use a non-empty string, undefined, or null",
//           );
//         }
//         this.parentPath = path;
//       }
//     }
//     if (!this.name && typeof this.name === "string") {
//       throw new Error("Expect the name to be undefined or a non-empty string");
//     }
//   }

//   // store the state here if root
//   private state?: Immutable<State>;
//   getState() {
//     if (!this.parent) {
//       return this.state;
//     }
//     const parentState = this.parent.getState();
//     if (this.parentPath) {
//       return parentState[this.parentPath];
//     }
//   }

//   // abstract or maybe input fields?

//   abstract initialState(): State;
// }

// abstract class SliceDefRoot<State> extends SliceDefBase<State> {

// }
// abstract class SliceDefInjected<State> extends SliceDefBase<State> {
  
// }