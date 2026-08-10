import { useRef } from 'react';
import { useRouter } from 'expo-router';

import { RecordingPanel, type RecordingPanelHandle } from '@/components/RecordingPanel';
import { ScreenShell } from '@/components/ScreenShell';
import { getCurrentRound, getRoundPlayers } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useRecordingBackHandler } from '@/hooks/useRecordingBackHandler';
import { useTranslation } from '@/hooks/useTranslation';

export function AttemptRecordingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const game = useGameStore((state) => state.game);
  const setAttemptRecording = useGameStore((state) => state.setAttemptRecording);
  const round = getCurrentRound(game);
  const recordingPanelRef = useRef<RecordingPanelHandle>(null);
  const handleBack = useRecordingBackHandler(recordingPanelRef, '/listen');

  if (!game || !round) {
    return <ScreenShell title={t('noGame')}>{null}</ScreenShell>;
  }

  const { guesser } = getRoundPlayers(game, round);
  const guesserName = guesser?.name ?? t('playerTwo');

  return (
    <ScreenShell title={t('yourTurn')} subtitle={t('guesserTurn', { name: guesserName })} showBack onBack={handleBack}>
      <RecordingPanel
        ref={recordingPanelRef}
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
