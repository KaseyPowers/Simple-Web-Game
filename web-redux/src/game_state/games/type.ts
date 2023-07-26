import type React from "react";
import type { Slice, SliceCaseReducers } from '@reduxjs/toolkit';
import { RequireOnlyOne } from "../../utils";

import type { BaseGameState } from "../type";
import { gameStateName } from "../type";

type CompViewType = React.JSXElementConstructor<{}>;

type ComponentPieces = RequireOnlyOne<{
    Component?: CompViewType,
    View?: CompViewType
}, "Component" | "View">

export type GameObj<T extends BaseGameState> = Pick<T, "id" | "name"> & ComponentPieces & {
    slice: Slice<T, SliceCaseReducers<T>, typeof gameStateName>,
};

export type BaseGameObj = GameObj<BaseGameState>;