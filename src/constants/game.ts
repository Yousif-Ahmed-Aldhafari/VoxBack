import type { GameSettings } from '@/types';

export const avatarChoices = ['🙂', '😎', '🤠', '🤩', '🥳', '😆', '🧠', '🎤', '🔥', '⚡'];

export const defaultGameSettings: GameSettings = {
  totalRounds: 5,
  recordingDuration: 5,
  difficulty: 'normal',
  mode: 'free',
};

export const roundOptions = [3, 5, 10] as const;
export const durationOptions = [3, 5, 10] as const;
