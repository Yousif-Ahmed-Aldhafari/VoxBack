import { useRouter } from 'expo-router';

import { RecordingPanel } from '@/components/RecordingPanel';
import { ScreenShell } from '@/components/ScreenShell';
import { getCurrentRound, getRoundPlayers } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useTranslation } from '@/hooks/useTranslation';

export function AttemptRecordingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const game = useGameStore((state) => state.game);
  const setAttemptRecording = useGameStore((state) => state.setAttemptRecording);
  const round = getCurrentRound(game);

  if (!game || !round) {
    return <ScreenShell title={t('noGame')}>{null}</ScreenShell>;
  }

  const { guesser } = getRoundPlayers(game, round);

  return (
    <ScreenShell title={t('yourTurn')} subtitle={t('guesserTurn', { name: guesser.name })} showBack>
      <RecordingPanel
        title={t('yourTurn')}
        prompt={t('sayWhatYouHeard')}
        maxDurationSeconds={game.settings.recordingDuration}
        playbackLabel={t('yourAttempt')}
        confirmLabel={t('continueToScore')}
        onConfirm={(recording) => {
          setAttemptRecording(recording.uri);
          router.push('/process-attempt');
        }}
      />
    </ScreenShell>
  );
}
