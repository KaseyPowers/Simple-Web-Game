import { type PieceFromOptions, allOptions, getIdGetter } from "./from_options";
import { BasePiecesStore } from "./stores";

const PlayingCardOptions = {
  suite: ["Spades", "Hearts", "Diamonds", "Clubs"],
  value: [2, 3, 4, 5, 6, 7, 8, 9, 10, "Ace", "Jack", "Queen", "King"],
} as const;

type PlayingCard = PieceFromOptions<typeof PlayingCardOptions>;

const allPlayingCards: PlayingCard[] = allOptions(PlayingCardOptions);

const getPieceId = getIdGetter(PlayingCardOptions);

// class PlayingCardStore extends BasePiecesStore<
