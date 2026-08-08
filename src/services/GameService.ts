import { defaultGameSettings } from '@/constants/game';
import { getChallengePhrase } from '@/constants/phrases';
import type { AudioSimilarityResult, Game, GameSettings, Language, Player, Round } from '@/types';

export function createPlayer(id: string, name: string, avatar?: string): Player {
  return {
    id,
    name: name.trim() || id,
    avatar,
    score: 0,
  };
}

export function createRounds(players: Player[], totalRounds: number, settings: GameSettings, language: Language): Round[] {
  return Array.from({ length: totalRounds }, (_, index) => {
    const number = index + 1;
    const evenIndex = index % 2 === 0;
    const creatorPlayerId = evenIndex ? players[0].id : players[1].id;
    const guesserPlayerId = evenIndex ? players[1].id : players[0].id;
    return {
      number,
      creatorPlayerId,
      guesserPlayerId,
      challengePhrase: settings.mode === 'challenge' ? getChallengePhrase(language, number) : undefined,
    };
  });
}

export function createGame(players: Player[], settings: GameSettings = defaultGameSettings, language: Language = 'en'): Game {
  const normalizedPlayers = players.slice(0, 2).map((player, index) => ({
    ...player,
    id: player.id || `player-${index + 1}`,
    name: player.name.trim() || `Player ${index + 1}`,
    score: 0,
  }));
  return {
    players: normalizedPlayers,
    rounds: createRounds(normalizedPlayers, settings.totalRounds, settings, language),
    currentRound: 1,
    totalRounds: settings.totalRounds,
    settings,
    startedAt: Date.now(),
  };
}

export function getCurrentRound(game?: Game) {
  return game?.rounds.find((round) => round.number === game.currentRound);
}

export function getPlayer(game: Game, playerId: string) {
  return game.players.find((player) => player.id === playerId);
}

export function getRoundPlayers(game: Game, round: Round) {
  return {
    creator: getPlayer(game, round.creatorPlayerId)!,
    guesser: getPlayer(game, round.guesserPlayerId)!,
  };
}

function updateRound(game: Game, updater: (round: Round) => Round): Game {
  return {
    ...game,
    rounds: game.rounds.map((round) => (round.number === game.currentRound ? updater(round) : round)),
  };
}

export function attachCreatorRecording(game: Game, uri: string) {
  return updateRound(game, (round) => ({ ...round, originalRecordingUri: uri }));
}

export function attachReversedTarget(game: Game, uri: string) {
  return updateRound(game, (round) => ({ ...round, reversedTargetUri: uri }));
}

export function attachAttemptRecording(game: Game, uri: string) {
  return updateRound(game, (round) => ({ ...round, attemptRecordingUri: uri }));
}

export function applyRoundScore(game: Game, reversedAttemptUri: string, result: AudioSimilarityResult): Game {
  const current = getCurrentRound(game);
  if (!current) {
    return game;
  }
  const previousScore = current.similarityScore ?? 0;
  const newScore = Math.max(0, Math.min(100, Math.round(result.score)));
  return {
    ...updateRound(game, (round) => ({
      ...round,
      reversedAttemptUri,
      similarityScore: newScore,
      similarityDetails: result.details,
    })),
    players: game.players.map((player) =>
      player.id === current.guesserPlayerId ? { ...player, score: player.score - previousScore + newScore } : player,
    ),
  };
}

export function retryCurrentAttempt(game: Game): Game {
  const current = getCurrentRound(game);
  if (!current) {
    return game;
  }
  const previousScore = current.similarityScore ?? 0;
  return {
    ...updateRound(game, (round) => ({
      ...round,
      attemptRecordingUri: undefined,
      reversedAttemptUri: undefined,
      similarityScore: undefined,
      similarityDetails: undefined,
    })),
    players: game.players.map((player) =>
      player.id === current.guesserPlayerId ? { ...player, score: Math.max(0, player.score - previousScore) } : player,
    ),
  };
}

export function advanceRound(game: Game): Game {
  if (game.currentRound >= game.totalRounds) {
    return { ...game, completedAt: game.completedAt ?? Date.now() };
  }
  return { ...game, currentRound: game.currentRound + 1 };
}

export function isGameComplete(game?: Game) {
  return Boolean(game?.completedAt || (game && game.currentRound >= game.totalRounds && getCurrentRound(game)?.similarityScore !== undefined));
}

export function getWinner(game: Game) {
  const [first, second] = game.players;
  if (first.score === second.score) {
    return undefined;
  }
  return first.score > second.score ? first : second;
}

export function getAverageSimilarity(game: Game) {
  const scored = game.rounds.filter((round) => round.similarityScore !== undefined);
  if (!scored.length) {
    return 0;
  }
  return Math.round(scored.reduce((sum, round) => sum + (round.similarityScore ?? 0), 0) / scored.length);
}

export function getBestRound(game: Game) {
  return game.rounds.reduce<Round | undefined>((best, round) => {
    if (round.similarityScore === undefined) {
      return best;
    }
    if (!best || (round.similarityScore ?? 0) > (best.similarityScore ?? 0)) {
      return round;
    }
    return best;
  }, undefined);
}
