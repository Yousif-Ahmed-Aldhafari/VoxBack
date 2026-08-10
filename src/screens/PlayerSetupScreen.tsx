import { ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { PartyButton } from '@/components/PartyButton';
import { PlayerNameCard } from '@/components/PlayerNameCard';
import { ScreenShell } from '@/components/ScreenShell';
import { useTranslation } from '@/hooks/useTranslation';
import { useGameStore } from '@/stores/gameStore';

export function PlayerSetupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const players = useGameStore((state) => state.draftPlayers);
  const setDraftPlayer = useGameStore((state) => state.setDraftPlayer);

  return (
    <ScreenShell title={t('playerSetupTitle')} subtitle={t('playerSetupSubtitle')} showBack>
      <PlayerNameCard
        title={t('playerOne')}
        name={players[0].name}
        avatar={players[0].avatar}
        onNameChange={(name) => setDraftPlayer(0, { name })}
        onAvatarChange={(avatar) => setDraftPlayer(0, { avatar })}
      />
      <PlayerNameCard
        title={t('playerTwo')}
        name={players[1].name}
        avatar={players[1].avatar}
        onNameChange={(name) => setDraftPlayer(1, { name })}
        onAvatarChange={(avatar) => setDraftPlayer(1, { avatar })}
      />
      <PartyButton title={t('continue')} icon={ArrowRight} onPress={() => router.push('/game-settings')} />
    </ScreenShell>
  );
}
