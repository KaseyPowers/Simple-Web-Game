import { OnChangeType } from "./interfaces";

// Keeping this state synchronous to avoid more complex logic at first
abstract class DerivedState<GameState, DerivedState> {
  state: undefined | DerivedState;
  // get loading() {
  //   return typeof this.state === "undefined";
  // }

  abstract getDerivedState(state: GameState): DerivedState;

  onChange: OnChangeType;

  constructor(onChange) {
    this.onChange = onChange;
  }

  updateState(newState: GameState) {
    // commented out but holding onto potential loading logic
    // if (this.state !== undefined) {
    //   this.state = undefined;
    //   this.onChange();
    // }
    this.state = this.getDerivedState(newState);
  }
}

export default DerivedState;
