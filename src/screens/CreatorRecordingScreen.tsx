import { useRef } from 'react';
import { useRouter } from 'expo-router';

import { RecordingPanel, type RecordingPanelHandle } from '@/components/RecordingPanel';
import { ScreenShell } from '@/components/ScreenShell';
import { getCurrentRound, getRoundPlayers } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useRecordingBackHandler } from '@/hooks/useRecordingBackHandler';
import { useTranslation } from '@/hooks/useTranslation';

export function CreatorRecordingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const game = useGameStore((state) => state.game);
  const setCreatorRecording = useGameStore((state) => state.setCreatorRecording);
  const round = getCurrentRound(game);
  const recordingPanelRef = useRef<RecordingPanelHandle>(null);
  const handleBack = useRecordingBackHandler(recordingPanelRef, '/game-settings');

  if (!game || !round) {
    return <ScreenShell title={t('noGame')}>{null}</ScreenShell>;
  }

  const { creator, guesser } = getRoundPlayers(game, round);
  const creatorName = creator?.name ?? t('playerOne');
  const guesserName = guesser?.name ?? t('playerTwo');

  return (
    <ScreenShell title={t('roundTitle', { round: round.number })} subtitle={t('creatorTurn', { name: creatorName })} showBack onBack={handleBack}>
      <RecordingPanel
        ref={recordingPanelRef}
        title={t('creatorTurn', { name: creatorName })}
        prompt={t('creatorPrompt', { name: guesserName })}
        maxDurationSeconds={game.settings.recordingDuration}
        playbackLabel={t('yourRecording')}
        confirmLabel={t('useThisRecording')}
        onConfirm={(recording) => {
          setCreatorRecording(recording.uri);
          router.push('/process-target');
        }}
      />
    </ScreenShell>
  );
}
