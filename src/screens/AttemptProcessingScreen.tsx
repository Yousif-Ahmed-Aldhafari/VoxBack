import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { ProcessingCard } from '@/components/ProcessingCard';
import { ScreenShell } from '@/components/ScreenShell';
import { compareAudioFiles } from '@/services/AudioSimilarityService';
import { reverseAudioFile } from '@/services/AudioReverseService';
import { getCurrentRound } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useTranslation } from '@/hooks/useTranslation';

export function AttemptProcessingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const game = useGameStore((state) => state.game);
  const setRoundScore = useGameStore((state) => state.setRoundScore);
  const [progress, setProgress] = useState(0.15);
  const round = getCurrentRound(game);

  useEffect(() => {
    let alive = true;
    const timer = setInterval(() => setProgress((value) => Math.min(0.92, value + 0.09)), 170);

    async function run() {
      try {
        if (!round?.attemptRecordingUri || !round.reversedTargetUri) {
          throw new Error('Missing attempt or target.');
        }
        setProgress(0.45);
        const reversedAttempt = await reverseAudioFile(round.attemptRecordingUri, 'attempt');
        setProgress(0.75);
        const result = await compareAudioFiles(round.reversedTargetUri, reversedAttempt.uri);
        if (!alive) {
          return;
        }
        setRoundScore(reversedAttempt.uri, result);
        setProgress(1);
        setTimeout(() => router.replace('/comparison'), 250);
      } catch {
        if (alive) {
          Alert.alert(t('processingFailed'), undefined, [{ text: t('retry'), onPress: () => router.replace('/record-attempt') }]);
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
  }, [round?.attemptRecordingUri, round?.reversedTargetUri, router, setRoundScore, t]);

  return (
    <ScreenShell title={t('analyzingVoice')} scroll={false}>
      <ProcessingCard title={t('reversingAttempt')} progress={progress} />
    </ScreenShell>
  );
}
