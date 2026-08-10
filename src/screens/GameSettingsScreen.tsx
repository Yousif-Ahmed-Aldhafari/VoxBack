import { ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { durationOptions, roundOptions } from '@/constants/game';
import { OptionGroup } from '@/components/OptionGroup';
import { PartyButton } from '@/components/PartyButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useTranslation } from '@/hooks/useTranslation';
import { useGameStore } from '@/stores/gameStore';
import type { Difficulty, GameMode } from '@/types';

export function GameSettingsScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const settings = useGameStore((state) => state.draftSettings);
  const setDraftSettings = useGameStore((state) => state.setDraftSettings);
  const startGame = useGameStore((state) => state.startGame);

  function start() {
    startGame(language);
    router.push('/round-intro');
  }

  return (
    <ScreenShell title={t('gameSettingsTitle')} showBack>
      <OptionGroup
        label={t('rounds')}
        value={settings.totalRounds}
        onChange={(totalRounds) => setDraftSettings({ totalRounds })}
        options={roundOptions.map((value) => ({ value, label: String(value) }))}
      />
      <OptionGroup
        label={t('recordingDuration')}
        value={settings.recordingDuration}
        onChange={(recordingDuration) => setDraftSettings({ recordingDuration })}
        options={durationOptions.map((value) => ({ value, label: t('secondsShort', { count: value }) }))}
      />
      <OptionGroup<Difficulty>
        label={t('difficulty')}
        value={settings.difficulty}
        onChange={(difficulty) => setDraftSettings({ difficulty })}
        options={[
          { value: 'easy', label: t('easy') },
          { value: 'normal', label: t('normal') },
          { value: 'hard', label: t('hard') },
        ]}
      />
      <OptionGroup<GameMode>
        label={t('mode')}
        value={settings.mode}
        onChange={(mode) => setDraftSettings({ mode })}
        options={[
          { value: 'free', label: t('freeMode'), description: t('freeModeHint') },
          { value: 'challenge', label: t('challengeMode'), description: t('challengeModeHint') },
        ]}
      />
      <PartyButton title={t('startRound')} icon={ArrowRight} onPress={start} />
    </ScreenShell>
  );
}
