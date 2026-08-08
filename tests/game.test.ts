import { translate } from '../src/localization/core';
import {
  advanceRound,
  applyRoundScore,
  attachAttemptRecording,
  attachCreatorRecording,
  attachReversedTarget,
  createGame,
  createPlayer,
  getAverageSimilarity,
  getBestRound,
  getCurrentRound,
  getWinner,
} from '../src/services/GameService';
import { isRecordingDurationValid } from '../src/utils/recordingValidation';

test('creates alternating creator and guesser roles', () => {
  const players = [createPlayer('p1', 'Player 1', '🙂'), createPlayer('p2', 'Player 2', '😎')];
  const game = createGame(players, { totalRounds: 5, recordingDuration: 5, difficulty: 'normal', mode: 'free' }, 'en');
  assert.equal(game.rounds[0].creatorPlayerId, 'p1');
  assert.equal(game.rounds[0].guesserPlayerId, 'p2');
  assert.equal(game.rounds[1].creatorPlayerId, 'p2');
  assert.equal(game.rounds[1].guesserPlayerId, 'p1');
});

test('awards score to the guessing player and replaces retry scores', () => {
  const players = [createPlayer('p1', 'Player 1'), createPlayer('p2', 'Player 2')];
  let game = createGame(players, { totalRounds: 3, recordingDuration: 5, difficulty: 'normal', mode: 'free' }, 'en');
  game = applyRoundScore(game, 'attempt-a.wav', { score: 91 });
  assert.equal(game.players[1].score, 91);
  game = applyRoundScore(game, 'attempt-b.wav', { score: 74 });
  assert.equal(game.players[1].score, 74);
});

test('completes a two-round integration-style flow', () => {
  const players = [createPlayer('p1', 'Player 1'), createPlayer('p2', 'Player 2')];
  let game = createGame(players, { totalRounds: 3, recordingDuration: 5, difficulty: 'normal', mode: 'challenge' }, 'en');
  game = attachCreatorRecording(game, 'creator.wav');
  game = attachReversedTarget(game, 'target.wav');
  game = attachAttemptRecording(game, 'attempt.wav');
  game = applyRoundScore(game, 'reverse-attempt.wav', { score: 88 });
  assert.equal(getCurrentRound(game)?.similarityScore, 88);
  game = advanceRound(game);
  assert.equal(game.currentRound, 2);
  assert.equal(getCurrentRound(game)?.creatorPlayerId, 'p2');
});

test('computes winner and game summaries', () => {
  const players = [createPlayer('p1', 'A'), createPlayer('p2', 'B')];
  let game = createGame(players, { totalRounds: 3, recordingDuration: 5, difficulty: 'normal', mode: 'free' }, 'en');
  game = applyRoundScore(game, 'one.wav', { score: 80 });
  game = advanceRound(game);
  game = applyRoundScore(game, 'two.wav', { score: 60 });
  assert.equal(getWinner(game)?.name, 'B');
  assert.equal(getAverageSimilarity(game), 70);
  assert.equal(getBestRound(game)?.similarityScore, 80);
});

test('validates recording duration boundaries', () => {
  assert.equal(isRecordingDurationValid(499, 500, 5), false);
  assert.equal(isRecordingDurationValid(500, 500, 5), true);
  assert.equal(isRecordingDurationValid(5300, 500, 5), false);
});

test('localizes template strings in English and Arabic', () => {
  assert.equal(translate('en', 'roundTitle', { round: 2 }), 'Round 2');
  assert.equal(translate('ar', 'roundTitle', { round: 2 }), 'الجولة 2');
});
