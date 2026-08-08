export type Player = {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  wins?: number;
};

export type Difficulty = 'easy' | 'normal' | 'hard';
export type GameMode = 'free' | 'challenge';
export type RecordingQuality = 'standard' | 'high';
export type Language = 'en' | 'ar';

export type Round = {
  number: number;
  creatorPlayerId: string;
  guesserPlayerId: string;
  challengePhrase?: string;
  originalRecordingUri?: string;
  reversedTargetUri?: string;
  attemptRecordingUri?: string;
  reversedAttemptUri?: string;
  similarityScore?: number;
  similarityDetails?: AudioSimilarityDetails;
};

export type GameSettings = {
  totalRounds: 3 | 5 | 10;
  recordingDuration: 3 | 5 | 10;
  difficulty: Difficulty;
  mode: GameMode;
};

export type Game = {
  players: Player[];
  rounds: Round[];
  currentRound: number;
  totalRounds: number;
  settings: GameSettings;
  startedAt: number;
  completedAt?: number;
};

export type AudioSimilarityDetails = {
  mfccSimilarity?: number;
  spectralSimilarity?: number;
  timingSimilarity?: number;
  energySimilarity?: number;
};

export type AudioSimilarityResult = {
  score: number;
  confidence?: number;
  details?: AudioSimilarityDetails;
};

export type LocalStatistics = {
  gamesPlayed: number;
  highestScore: number;
  bestSimilarity: number;
  perfectRounds: number;
  wins: Record<string, number>;
  draws: number;
};
