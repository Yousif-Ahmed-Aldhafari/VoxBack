import { ArrowRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

import { PartyButton } from '@/components/PartyButton';
import { PlayerNameCard } from '@/components/PlayerNameCard';
import { ScreenShell } from '@/components/ScreenShell';
import { useTranslation } from '@/hooks/useTranslation';
import { useGameStore } from '@/stores/gameStore';
import { theme } from '@/theme';

export function PlayerSetupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const players = useGameStore((state) => state.draftPlayers);
  const setDraftPlayer = useGameStore((state) => state.setDraftPlayer);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { height, width } = useWindowDimensions();
  const denseLayout = height < 700 || width < 360;
  const compactLayout = denseLayout || height < 900 || width < 430;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <ScreenShell
      title={t('playerSetupTitle')}
      subtitle={t('playerSetupSubtitle')}
      showBack
      scroll
      scrollEnabled={keyboardVisible}
      bounces={keyboardVisible}
      contentStyle={[
        compactLayout ? styles.compactContent : null,
        denseLayout ? styles.denseContent : null,
        keyboardVisible ? styles.keyboardContent : null,
      ]}
      headerStyle={compactLayout ? styles.compactHeader : null}
      titleStyle={[compactLayout ? styles.compactTitle : null, denseLayout ? styles.denseTitle : null]}
      subtitleStyle={[compactLayout ? styles.compactSubtitle : null, denseLayout ? styles.denseSubtitle : null]}
    >
      <PlayerNameCard
        compact={compactLayout}
        dense={denseLayout}
        title={t('playerOne')}
        name={players[0].name}
        avatar={players[0].avatar}
        onNameChange={(name) => setDraftPlayer(0, { name })}
        onAvatarChange={(avatar) => setDraftPlayer(0, { avatar })}
      />
      <PlayerNameCard
        compact={compactLayout}
        dense={denseLayout}
        title={t('playerTwo')}
        name={players[1].name}
        avatar={players[1].avatar}
        onNameChange={(name) => setDraftPlayer(1, { name })}
        onAvatarChange={(avatar) => setDraftPlayer(1, { avatar })}
      />
      <PartyButton compact={compactLayout} title={t('continue')} icon={ArrowRight} onPress={() => router.push('/game-settings')} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  compactContent: {
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  denseContent: {
    gap: 2,
    padding: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  keyboardContent: {
    paddingBottom: theme.spacing.xxl,
  },
  compactHeader: {
    gap: theme.spacing.xs,
  },
  compactTitle: {
    fontSize: theme.typography.h2,
  },
  denseTitle: {
    fontSize: 24,
  },
  compactSubtitle: {
    fontSize: theme.typography.small,
    lineHeight: 18,
  },
  denseSubtitle: {
    lineHeight: 16,
  },
});
