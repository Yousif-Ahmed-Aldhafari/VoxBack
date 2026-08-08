import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer } from 'expo-audio';

import { writeBytesToCache } from './AudioFileService';
import { createToneWav } from './WavAudio';
import { useSettingsStore } from '@/stores/settingsStore';

type FeedbackKind = 'tap' | 'countdown' | 'recordStart' | 'recordStop' | 'reverse' | 'score' | 'perfect' | 'winner';

const toneUris = new Map<FeedbackKind, string>();

const toneMap: Record<FeedbackKind, { frequency: number; duration: number; volume: number }> = {
  tap: { frequency: 720, duration: 42, volume: 0.08 },
  countdown: { frequency: 580, duration: 68, volume: 0.1 },
  recordStart: { frequency: 820, duration: 90, volume: 0.12 },
  recordStop: { frequency: 360, duration: 90, volume: 0.12 },
  reverse: { frequency: 440, duration: 130, volume: 0.1 },
  score: { frequency: 760, duration: 150, volume: 0.12 },
  perfect: { frequency: 980, duration: 200, volume: 0.13 },
  winner: { frequency: 660, duration: 260, volume: 0.13 },
};

export function useFeedback() {
  const soundEffects = useSettingsStore((state) => state.soundEffects);
  const haptics = useSettingsStore((state) => state.haptics);

  return useCallback(
    async (kind: FeedbackKind) => {
      if (haptics) {
        void triggerHaptic(kind);
      }
      if (soundEffects) {
        void playTone(kind);
      }
    },
    [haptics, soundEffects],
  );
}

async function triggerHaptic(kind: FeedbackKind) {
  if (kind === 'perfect' || kind === 'winner') {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return;
  }
  if (kind === 'recordStart' || kind === 'recordStop' || kind === 'score') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    return;
  }
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

async function playTone(kind: FeedbackKind) {
  const uri = await getToneUri(kind);
  const player = createAudioPlayer({ uri }, { updateInterval: 200, keepAudioSessionActive: false });
  player.play();
}

async function getToneUri(kind: FeedbackKind) {
  const existing = toneUris.get(kind);
  if (existing) {
    return existing;
  }
  const tone = toneMap[kind];
  const uri = await writeBytesToCache(createToneWav(tone.frequency, tone.duration, 22050, tone.volume), `sfx-${kind}`);
  toneUris.set(kind, uri);
  return uri;
}
