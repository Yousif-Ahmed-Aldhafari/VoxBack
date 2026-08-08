import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { applyRTL, getDeviceLanguage } from '@/localization';
import type { Game, Language, LocalStatistics, RecordingQuality } from '@/types';

const emptyStats: LocalStatistics = {
  gamesPlayed: 0,
  highestScore: 0,
  bestSimilarity: 0,
  perfectRounds: 0,
  wins: {},
  draws: 0,
};

type SettingsState = {
  language: Language;
  soundEffects: boolean;
  music: boolean;
  haptics: boolean;
  recordingQuality: RecordingQuality;
  tutorialSeen: boolean;
  stats: LocalStatistics;
  setLanguage: (language: Language) => void;
  setSoundEffects: (enabled: boolean) => void;
  setMusic: (enabled: boolean) => void;
  setHaptics: (enabled: boolean) => void;
  setRecordingQuality: (quality: RecordingQuality) => void;
  completeTutorial: () => void;
  recordCompletedGame: (game: Game) => void;
  resetStats: () => void;
};

const initialLanguage = getDeviceLanguage();
applyRTL(initialLanguage);

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: initialLanguage,
      soundEffects: true,
      music: false,
      haptics: true,
      recordingQuality: 'standard',
      tutorialSeen: false,
      stats: emptyStats,
      setLanguage: (language) => {
        applyRTL(language);
        set({ language });
      },
      setSoundEffects: (soundEffects) => set({ soundEffects }),
      setMusic: (music) => set({ music }),
      setHaptics: (haptics) => set({ haptics }),
      setRecordingQuality: (recordingQuality) => set({ recordingQuality }),
      completeTutorial: () => set({ tutorialSeen: true }),
      recordCompletedGame: (game) =>
        set((state) => {
          const [first, second] = game.players;
          const highestScore = Math.max(state.stats.highestScore, first.score, second.score);
          const bestSimilarity = Math.max(
            state.stats.bestSimilarity,
            ...game.rounds.map((round) => round.similarityScore ?? 0),
          );
          const perfectRounds = state.stats.perfectRounds + game.rounds.filter((round) => (round.similarityScore ?? 0) >= 100).length;
          const wins = { ...state.stats.wins };
          let draws = state.stats.draws;
          if (first.score === second.score) {
            draws += 1;
          } else {
            const winner = first.score > second.score ? first : second;
            wins[winner.name] = (wins[winner.name] ?? 0) + 1;
          }
          return {
            stats: {
              gamesPlayed: state.stats.gamesPlayed + 1,
              highestScore,
              bestSimilarity,
              perfectRounds,
              wins,
              draws,
            },
          };
        }),
      resetStats: () => set({ stats: emptyStats }),
    }),
    {
      name: 'voxback-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyRTL(state.language);
          I18nManager.allowRTL(state.language === 'ar');
        }
      },
    },
  ),
);
