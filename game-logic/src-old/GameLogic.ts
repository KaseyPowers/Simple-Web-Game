import { ActionTypeBase } from "./interfaces";

import DerivedState from "./DerivedState";
import StateHistory, { StateHistoryOptions } from "./StateHitory";

type GetDerivedStateFn<G, D> = <G, D>(state: G) => D | Promise<D>;

interface GameLogicOptions<G, A extends ActionTypeBase>
  extends Omit<StateHistoryOptions<G, A>, "onChange"> {
  derivedStates: {
    [key: string]: DerivedState;
  };
}

class GameLogic<G, A extends ActionTypeBase> {
  stateHistory: StateHistory<G, A>;

  constructor({ ...options }: StateHistoryOptions<G, A>) {
    this.stateHistory = new StateHistory(options);
  }
}
