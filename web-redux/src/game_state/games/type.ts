import type React from "react";
import type { Slice, SliceCaseReducers } from '@reduxjs/toolkit';
import { RequireOnlyOne } from "../../utils";

import type { BaseGameState } from "../type";
import { gameStateName } from "../type";

type CompViewType = React.JSXElementConstructor<{}>;

export interface ComponentParts {
    Prep?: CompViewType, /** The initial view, Default shows list of players waiting to play. Optional because default  */
    Started?: CompViewType, /** Optional Round 0 view for stuff like configuring the player order. */

    Playing: CompViewType, /** Required view, will be displayed while game is playing  */
    Finished?: CompViewType, /** View for after the game is complete. TBD if skipped or will add default */
}
type BaseComponentPieces = {
    Component?: CompViewType,
    View?: ComponentParts
}
type BaseInputComponentPieces = {
    Component?: CompViewType,
    View?: ComponentParts | CompViewType;
}

type ComponentPieces = RequireOnlyOne<BaseComponentPieces, "Component" | "View">
type InputComponentPieces = RequireOnlyOne<BaseInputComponentPieces, "Component" | "View">

type GameObjSlice<T extends BaseGameState> = {
    slice: Slice<T, SliceCaseReducers<T>, typeof gameStateName>,
};

export type GameObj<T extends BaseGameState> = Pick<T, "id" | "name"> & GameObjSlice<T> & ComponentPieces;

export type GameObjInput<T extends BaseGameState> = Partial<Pick<T, "id" | "name">> & GameObjSlice<T> & InputComponentPieces;

export type BaseGameObj = GameObj<BaseGameState>;

export type BaseGameObjInput = GameObjInput<BaseGameState>;