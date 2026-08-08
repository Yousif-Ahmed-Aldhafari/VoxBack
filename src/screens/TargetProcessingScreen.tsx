import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { ProcessingCard } from '@/components/ProcessingCard';
import { ScreenShell } from '@/components/ScreenShell';
import { getCurrentRound } from '@/services/GameService';
import { reverseAudioFile } from '@/services/AudioReverseService';
import { useGameStore } from '@/stores/gameStore';
import { useTranslation } from '@/hooks/useTranslation';

export function TargetProcessingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const game = useGameStore((state) => state.game);
  const setReversedTarget = useGameStore((state) => state.setReversedTarget);
  const [progress, setProgress] = useState(0.2);
  const round = getCurrentRound(game);

  useEffect(() => {
    let alive = true;
    const timer = setInterval(() => setProgress((value) => Math.min(0.9, value + 0.13)), 150);

    async function run() {
      try {
        if (!round?.originalRecordingUri) {
          throw new Error('Missing creator recording.');
        }
        const reversed = await reverseAudioFile(round.originalRecordingUri, 'target');
        if (!alive) {
          return;
        }
        setProgress(1);
        setReversedTarget(reversed.uri);
        setTimeout(() => router.replace('/pass-phone'), 250);
      } catch {
        if (alive) {
          Alert.alert(t('processingFailed'), undefined, [{ text: t('retry'), onPress: () => router.replace('/record-creator') }]);
        }
      } finally {
        clearInterval(timer);
      }
    }

    void run();
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [round?.originalRecordingUri, router, setReversedTarget, t]);

  return (
    <ScreenShell title={t('roundTitle', { round: round?.number ?? 1 })} scroll={false}>
      <ProcessingCard title={t('reversingVoice')} progress={progress} />
    </ScreenShell>
  );
}
