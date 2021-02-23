// export interface BaseGameState {}; // TODO: populate this if needed

export interface ActionTypeBase {
  action: string;
  source: string;
}

export type OnChangeType = () => void;
