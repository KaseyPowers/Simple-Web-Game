interface GameState {}
interface ActionType {
  action: string;
  source: string;
}

interface historyStep {
  action: ActionType;
  state?: GameState; // TODO: state definition stuff
}

// TODO: make gamestate an argument thing with the <>
abstract class GameLogic {
  // history of the state, to let us recalculate if events happen out of order
  // NOTE: maybe put a limit on the length? dropping the oldest at a certain point?
  // TODO: when recalculating, would be nice to have a way of knowing if the injected event would change anything to avoid re-ordering? perhaps checking the state at a certain point around the injected one to compare and stop recalculating if it's unchanged
  stateHistory = [];

  // returns true if all of the stateHistory is finished
  get historyComplete(): boolean {
    return this.stateHistory.every((step) => step.state);
  }

  // the most recent state
  get currentState(): false | GameState {
    return (
      this.historyComplete &&
      this.stateHistory[this.stateHistory.length - 1].state
    );
  }

  // function to get the first unfinished history object, and get it's state added
  // NOTE: finding the first empty state each time instead of using a loop in case the loop changes while wating for async responses
  private async getNextState() {
    // to store the index of the history item that's needed (assuming there will always be a valid step at index 0)
    let workIndex: number = -1;
    // skipping 0, assuming it's valid, NOTE: could add a check to confirm
    for (let i = 1; i < this.stateHistory.length; i += 1) {
      const hasState: boolean = !!this.stateHistory[i].state;
      // workIndex will be -1 until a step without state is found
      if (workIndex < 0) {
        if (!hasState) {
          workIndex = i;
        }
      } else {
        // once the workIndex is found, to be safe make sure we invalidate the rest of the history (in case we add the ability to inject an action earlier in the history if events come out of order)
        // NOTE: if this is something that happens often we could consider a solution that saves the state in a temporary way, that way if the new state/old state are equal at any point, the rest of the states can be considered valid again
        if (hasState) {
          delete this.stateHistory[i].state;
        }
      }
    }

    // nothing found
    if (workIndex < 0) {
      return false; // maybe throw error here or maybe it's fine
    }

    // putting these in variables like this to avoid the reference being out of date by the time the function is complete
    const currentStep = this.stateHistory[workIndex];
    const previousState = this.stateHistory[workIndex - 1].state;
    // this should assign the state from the function regardless of if that function is synchronous
    currentStep.state = await this.stateFromAction(
      previousState,
      currentStep.action
    );
    return true;
  }

  private processingHistoryPromise: Promise<void>;

  // function that will run in the stored promise
  private async processHistory(): Promise<void> {
    // check if the getNextStae has anything to run?
    const didChange = await this.getNextState();

    // if nothing changed because the history array is finished, end the cycle
    if (!didChange) {
      if (this.historyComplete) {
        return;
      } else {
        throw new Error(
          "No changes made but the history isn't complete either"
        );
      }
    }
    // if a change was made, then run again until all changes are finished
    return this.processHistory();
  }

  checkHistory(): Promise<void> {
    if (!this.processingHistoryPromise) {
      this.processingHistoryPromise = this.processHistory().then(() => {
        delete this.processingHistoryPromise;
      });
    }
    return this.processingHistoryPromise;
  }

  // base action function that someone extending this class must define
  // should accept an object with at minimum an action string/id, and an id for what/who tirggered that action, and return the new game state
  abstract stateFromAction(
    previousState: GameState,
    action: ActionType
  ): GameState | Promise<GameState>;

  // an array of the minimum keys needed to define an action, used to
  minimumActionKeys: string[] = ["action", "source"];
  isValidAction(action: ActionType) {
    // simplist version of this, makes sure the action has the minimum keys (can be used by extending class with the super call)
    return this.minimumActionKeys.every(
      (key) => typeof action[key] !== "undefined"
    );
  }
  // event function to handle calling stateFromAction and making sure the event is in the correct location
  onAction(action: ActionType) {
    this.stateHistory.push({
      action,
    });
    this.checkHistory();
  }

  // Function to call when the state updates
  abstract onStateUpdate();
}
