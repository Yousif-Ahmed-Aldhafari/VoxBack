import { create } from 'zustand';

import { defaultGameSettings } from '@/constants/game';
import {
  advanceRound,
  applyRoundScore,
  attachAttemptRecording,
  attachCreatorRecording,
  attachReversedTarget,
  createGame,
  createPlayer,
  retryCurrentAttempt,
} from '@/services/GameService';
import type { AudioSimilarityResult, Game, GameSettings, Language, Player } from '@/types';

type GameState = {
  draftPlayers: Player[];
  draftSettings: GameSettings;
  game?: Game;
  setDraftPlayer: (index: 0 | 1, values: Partial<Pick<Player, 'name' | 'avatar'>>) => void;
  setDraftSettings: (settings: Partial<GameSettings>) => void;
  startGame: (language: Language) => void;
  restartSamePlayers: (language: Language) => void;
  newPlayers: () => void;
  clearGame: () => void;
  setCreatorRecording: (uri: string) => void;
  setReversedTarget: (uri: string) => void;
  setAttemptRecording: (uri: string) => void;
  setRoundScore: (reversedAttemptUri: string, result: AudioSimilarityResult) => void;
  retryAttempt: () => void;
  nextRound: () => void;
};

const initialPlayers: Player[] = [
  createPlayer('player-1', 'Player 1', '🙂'),
  createPlayer('player-2', 'Player 2', '😎'),
];

export const useGameStore = create<GameState>((set, get) => ({
  draftPlayers: initialPlayers,
  draftSettings: defaultGameSettings,
  setDraftPlayer: (index, values) =>
    set((state) => ({
      draftPlayers: state.draftPlayers.map((player, currentIndex) =>
        currentIndex === index ? { ...player, ...values } : player,
      ),
    })),
  setDraftSettings: (settings) => set((state) => ({ draftSettings: { ...state.draftSettings, ...settings } })),
  startGame: (language) =>
    set((state) => ({
      game: createGame(state.draftPlayers, state.draftSettings, language),
    })),
  restartSamePlayers: (language) => {
    const current = get().game;
    const players = current?.players.map((player) => ({ ...player, score: 0 })) ?? get().draftPlayers;
    const settings = current?.settings ?? get().draftSettings;
    set({ game: createGame(players, settings, language), draftPlayers: players, draftSettings: settings });
  },
  newPlayers: () => set({ game: undefined, draftPlayers: initialPlayers, draftSettings: defaultGameSettings }),
  clearGame: () => set({ game: undefined }),
  setCreatorRecording: (uri) => set((state) => (state.game ? { game: attachCreatorRecording(state.game, uri) } : state)),
  setReversedTarget: (uri) => set((state) => (state.game ? { game: attachReversedTarget(state.game, uri) } : state)),
  setAttemptRecording: (uri) => set((state) => (state.game ? { game: attachAttemptRecording(state.game, uri) } : state)),
  setRoundScore: (reversedAttemptUri, result) =>
    set((state) => (state.game ? { game: applyRoundScore(state.game, reversedAttemptUri, result) } : state)),
  retryAttempt: () => set((state) => (state.game ? { game: retryCurrentAttempt(state.game) } : state)),
  nextRound: () => set((state) => (state.game ? { game: advanceRound(state.game) } : state)),
}));
