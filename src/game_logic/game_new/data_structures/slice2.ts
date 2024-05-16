/**
 * Slices:
 * The core structure for managing data:
 *
 * onChange: listener for changes to the slices data
 * <MAYBE> didChange(previousState, nextState) => boolean: Potential utility for verifying change happened if Object.is/=== checks don't work
 * getData: returns this slices data
 *
 * `on${Capitalize<string>}`: Action - make a change to the state
 *
 * DerivedTypes:
 * - "none": Default if not specified, means this type shouldn't be exposed to client at all, (or can be used with others to indicate that the public/minimum state is not exposing anything)
 * - "public" OR "min": Default/required for exposed data, what is available to anyone (ex. game observers), minimum exposed data
 * - "max": Useful pairing with "public"/"minimum", for the most detail to reveal
 * - custom (string): any other types expected
 *
 * `get${Capitalize<string>}State`: Derived - Returns a derived state value
 *
 *
 * utilities: Map of helper functions
 * utilityActions: Actions that return other values too, useful to call from other actions (ex. drawCard action that modifies the drawDeck slice and returns drawn card)
 *
 *
 * Optional:
 * TBD If optional inputs or if we want to do an extension of slice logic for this:
 * SliceContainer that holds one or more slices, wrapping with extra logic, or possibly combining a current slice + child slices
 */

import type {
  AnyFunction,
  BlankObject,
  FnReturns,
  IsMaybeVoid,
  MaybeFromFn,
  OmitNever,
  RecordWithoutKeys,
  WithoutOverlap,
} from "~/utils/types";
import {
  type ActionKey,
  type MapGetActionFn,
  type ActionDef,
  type ActionInputDef,
  type UnknownAction,
  type UnknownActionFn,
  type UnknownActionInput,
  type UnknownUtilAction,
  type UnknownUtilActionFn,
  type UnknownUtilActionInput,
  type UtilActionDef,
  type ActionInputFromDef,
  type UtilActionInputFromDef,
  type MapGetActionInput,
  createAction,
  MapActionInputFromDef,
  MapUtilActionInputFromDef,
  mapCreateActions,
  MapActionDefFromInput,
  MapUtilActionDefFromInput,
  UnknownActionDefMap,
  UnknownUtilActionDefMap,
  UnknownActionInputMap,
} from "./actions";
import { freeze } from "immer";

// bare minimum slice def
type SliceDefSimple<State, Name extends string = string> = {
  name: Name;
  utils?: Record<string, AnyFunction>;
  getInitialState(): State;
};
// bare minimum slice def input
type SliceDefSimpleInput<State, Name extends string = string> = {
  name: Name;
  utils?: Record<string, AnyFunction>;
  initialState: MaybeFromFn<State>;
};

function isInitialStateFunction<State>(
  val: MaybeFromFn<State>,
): val is FnReturns<State> {
  return typeof val !== "function";
}

// bare minimum slice creation
function createSimpleSlice<State, Name extends string = string>(
  options: SliceDefSimpleInput<State, Name>,
): SliceDefSimple<State, Name> {
  const { name, initialState: inputState } = options;
  const initialState: State = freeze(
    isInitialStateFunction(inputState) ? inputState() : inputState,
    true,
  );
  const output: SliceDefSimple<State, Name> = {
    name,
    getInitialState() {
      return initialState;
    },
  };
  if ("utils" in options) {
    output.utils = options.utils;
  }
  return output;
}

export type ActionsDefRecord<S = unknown, P = unknown, M = unknown> = Record<
  ActionKey<string>,
  ActionDef<S, P, M>
>;

// just the part of the slice for actions
type SliceActionsDef<
  State,
  ActionsDefMap extends UnknownActionDefMap<State> = never,
  UtilActionsDefMap extends WithoutOverlap<
    UnknownUtilActionDefMap<State>,
    UtilActionsDefMap,
    ActionsDefMap
  > = never,
> = OmitNever<{
  actionDefs: ActionsDefMap;
  actionUtilDefs: UtilActionsDefMap;
}> &
  MapGetActionFn<ActionsDefMap> &
  MapGetActionFn<UtilActionsDefMap>;

type SliceActionsInput<
  State,
  ActionsInputMap extends UnknownActionInputMap<State> = never,
  UtilActionsInputMap extends WithoutOverlap<
    UnknownActionInputMap<State>,
    UtilActionsInputMap,
    ActionsInputMap
  > = never,
> = OmitNever<{
  actionDefs: ActionsInputMap;
  actionUtilDefs: UtilActionsInputMap;
}>;

// (ActionsDefMap extends Record<ActionKey<string>, UnknownAction<State>>
//   ? { actionDefs: ActionsDefMap } & MapGetActionFn<
//       ActionsDefMap,
//       UnknownAction<State>
//     >
//   : BlankObject) &
//   (UtilActionsDefMap extends Record<string, UnknownUtilAction<State>>
//     ? { actionUtilDefs: UtilActionsDefMap } & MapGetActionFn<
//         UtilActionsDefMap,
//         UnknownUtilAction<State>
//       >
//     : BlankObject);

function createBaseActionsSlice<
  State,
  ActionsDefMap extends UnknownActionDefMap<State> = never,
  UtilActionsDefMap extends WithoutOverlap<
    UnknownUtilActionDefMap<State>,
    UtilActionsDefMap,
    ActionsDefMap
  > = never,
>(
  options: OmitNever<{
    actionDefs: MapActionInputFromDef<ActionsDefMap>;
    actionUtilDefs: MapUtilActionInputFromDef<UtilActionsDefMap>;
  }>,
): SliceActionsDef<State, ActionsDefMap, UtilActionsDefMap>;

function createBaseActionsSlice<
  State,
  ActionsInputMap extends UnknownActionInputMap<State> = never,
  UtilActionsInputMap extends WithoutOverlap<
    UnknownActionInputMap<State>,
    UtilActionsInputMap,
    ActionsInputMap
  > = never,
>(
  options: SliceActionsInput<State, ActionsInputMap, UtilActionsInputMap>,
): SliceActionsDef<
  State,
  MapActionDefFromInput<ActionsInputMap>,
  MapUtilActionDefFromInput<UtilActionsInputMap>
>;

// type SliceActionsInput<
//   State,
//   InputActionsDefMap extends Record<
//     ActionKey<string>,
//     UnknownActionInput<State>
//   > | void = void,
//   InputUtilActionsDefMap extends RecordWithout<
//     string,
//     UnknownUtilActionInput<State>,
//     keyof InputActionsDefMap
//   > | void = void,
// > = (InputActionsDefMap extends Record<
//   ActionKey<string>,
//   UnknownActionInput<State>
// >
//   ? { actionDefs: InputActionsDefMap }
//   : BlankObject) &
//   (InputUtilActionsDefMap extends Record<string, UnknownUtilActionInput<State>>
//     ? {
//         actionUtilDefs: InputUtilActionsDefMap;
//       }
//     : BlankObject);

// function createBaseActionsSlice<
//   Options extends SliceActionsInput<State>,
//   State,
// >(
//   options: State,
// ): SliceActionsDef<
//   State,
//   Options extends SliceActionsInput<State, infer ActionInputs>
//     ? MapActionDefFromInput<ActionInputs, State>
//     : void,
//   Options extends SliceActionsInput<State, any, infer UtilInputs>
//     ? MapUtilActionDefFromInput<UtilInputs, State>
//     : void
// >;

function createBaseActionsSlice<
  State,
  ActionsDefMap extends Record<ActionKey<string>, UnknownAction<State>>,
>({
  actionDefs,
}: SliceActionsInput<State, ActionsDefMap>): SliceActionsDef<
  State,
  ActionsDefMap
> {
  const outputActionDefs: ActionsDefMap =
    mapCreateActions<ActionsDefMap>(actionDefs);

  const actionKeys = Object.keys(actionDefs) as (keyof typeof actionDefs)[];
  const actionDefs: ActionsDefMap = actionKeys.reduce((output, key) => {
    const inputDef = actionDefs[key];
    if (inputDef) {
      output[key as keyof ActionsDefMap] = createAction(inputDef);
    }
    return output;
  }, {} as ActionsDefMap);
  //   const outputActionDefs: ActionDefMap = actionKeys.reduce<ActionsDefMap>(
  //     (output, key) => {
  //       return output;
  //     },
  //     {} as ActionDefMap,
  //   );

  const outputActionDefs: ActionDefMap = Object.fromEntries(
    actionKeys.map((key) => {
      if (key in actionDefs) {
        const inputDef = actionDefs[key];
        const actionDef = createAction(inputDef);
      }

      return [key, createAction(inputDef)];
    }),
  );

  const output: Partial<SliceActionsDef<State, ActionsDefMap>> = {
    actionDefs: {},
  };
}

function createActionSlice<
  State,
  ActionsDefMap extends Record<
    ActionKey<string>,
    UnknownAction<State>
  > | void = void,
  UtilActionsDefMap extends RecordWithoutKeys<
    string,
    UnknownUtilAction<State>,
    keyof ActionsDefMap
  > | void = void,
>(
  options: SliceActionsInput<State, ActionsDefMap, UtilActionsDefMap>,
): SliceActionsDef<State, ActionsDefMap, UtilActionsDefMap> {
  const output: Partial<
    SliceActionsDef<State, ActionsDefMap, UtilActionsDefMap>
  > = {};

  if ("actionDefs" in options) {
    const inputDefs = options.actionDefs;
    const actionDefKeys = Object.keys(inputDefs) as (keyof typeof inputDefs)[];
    output.actionDefs = {};

    output.actionDefs = actionDefKeys.reduce((output, key) => {
      const actionInput = inputDefs[key];
      if (actionInput) {
        output[key] = createAction(actionInput);
      }

      const actionDef = createAction(inputDefs[key]);

      output[key] = createAction(inputDefs[key]);
      return output;
    }, {} as Partial<ActionsDefMap>);
  }

  return output;
}

// type SliceDefShared<
//   State,
//   Name extends string = string,
//   ActionsDefMap extends ActionsDefRecord<State> | void = void,
//   UtilActionsDefMap extends RecordWithout<
//     string,
//     UnknownUtilAction<State>,
//     keyof ActionsDefMap
//   > | void = void,
// > = {
//   name: Name;
//   utils?: Record<string, AnyFunction>;
// } & (ActionsDefMap extends ActionsDefRecord<State>
//   ? { actionDefs: ActionsDefMap }
//   : BlankObject) &
//   (UtilActionsDefMap extends Record<string, UnknownUtilAction<State>>
//     ? { actionUtilDefs: UtilActionsDefMap }
//     : BlankObject);

// export type SliceDef<
//   State,
//   Name extends string = string,
//   ActionsDefMap extends ActionsDefRecord<State> | void = void,
//   UtilActionsDefMap extends RecordWithout<
//     string,
//     UnknownUtilAction<State>,
//     keyof ActionsDefMap
//   > | void = void,
// > = SliceDefShared<State, Name, ActionsDefMap, UtilActionsDefMap> & {
//   getInitialState(): State;
// } & (ActionsDefMap extends ActionsDefRecord<State>
//     ? MapGetActionFn<ActionsDefMap, UnknownAction<State>>
//     : BlankObject) &
//   (UtilActionsDefMap extends Record<string, UnknownUtilAction<State>>
//     ? MapGetActionFn<UtilActionsDefMap, UnknownUtilAction<State>>
//     : BlankObject);

// type SliceDefInput<
//   State,
//   Name extends string = string,
//   ActionsDefMap extends ActionsDefRecord<State> | void = void,
//   UtilActionsDefMap extends RecordWithout<
//     string,
//     UnknownUtilAction<State>,
//     keyof ActionsDefMap
//   > | void = void,
// > = SliceDefShared<State, Name, ActionsDefMap, UtilActionsDefMap> & {
//   initialState: MaybeFromFn<State>;
// };

// function createSliceActions<
// State,
// ActionsDefMap extends ActionsDefRecord<State> | void = void,
// UtilActionsDefMap extends RecordWithout<
//   string,
//   UnknownUtilAction<State>,
//   keyof ActionsDefMap
// > | void = void,
// >(options: SliceDefInput<State, Name, ActionsDefMap, UtilActionsDefMap>) {
//     const base = createSliceSimple<State, Name>(options);
//     const actionDefs: ActionsDefMap = ("actionDefs" in options) ? options.actionDefs : void;
// }

// // function createSliceBase<
// //   State,
// //   Name extends string = string,
// //   ActionsDefMap extends ActionsDefRecord<State> | void = void,
// //   UtilActionsDefMap extends RecordWithout<
// //     string,
// //     UnknownUtilAction<State>,
// //     keyof ActionsDefMap
// //   > | void = void,
// // >(
// //   options: SliceDefInput<State, Name, ActionsDefMap, UtilActionsDefMap>,
// // ): SliceDef<State, Name, ActionsDefMap, UtilActionsDefMap>;
// // function createSliceBase<State, Name extends string = string>({
// //   name,
// //   utils,
// //   ...rest
// // }: SliceDefInput<State, Name, any, any>) {
// //   const output: Partial<SliceDef<State, Name, any, any>> = {
// //     name,
// //   };
// //   const _initialState: State = freeze(
// //     isInitialStateFunction(initialState) ? initialState() : initialState,
// //     true,
// //   );

// //   return {
// //     name,
// //     getInitialState: () => _initialState,
// //   };
// // }
