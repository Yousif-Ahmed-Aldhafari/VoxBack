import { useRouter } from 'expo-router';

import { RecordingPanel } from '@/components/RecordingPanel';
import { ScreenShell } from '@/components/ScreenShell';
import { getCurrentRound, getRoundPlayers } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useTranslation } from '@/hooks/useTranslation';

export function CreatorRecordingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const game = useGameStore((state) => state.game);
  const setCreatorRecording = useGameStore((state) => state.setCreatorRecording);
  const round = getCurrentRound(game);

  if (!game || !round) {
    return <ScreenShell title={t('noGame')}>{null}</ScreenShell>;
  }

  const { creator, guesser } = getRoundPlayers(game, round);

  return (
    <ScreenShell title={t('roundTitle', { round: round.number })} subtitle={t('creatorTurn', { name: creator.name })} showBack>
      <RecordingPanel
        title={t('creatorTurn', { name: creator.name })}
        prompt={t('creatorPrompt', { name: guesser.name })}
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
