import { Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PartyButton } from './PartyButton';
import { useTranslation } from '@/hooks/useTranslation';
import { useAudioPlaybackService } from '@/services/AudioPlaybackService';
import { theme } from '@/theme';

type AudioClipControlsProps = {
  uri?: string;
  label: string;
};

export function AudioClipControls({ uri, label }: AudioClipControlsProps) {
  const { t, isRTL } = useTranslation();
  const playback = useAudioPlaybackService(uri);

  async function safe(action: () => void | Promise<void>) {
    try {
      await action();
    } catch {
      Alert.alert(t('playbackFailed'));
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(playback.progress * 100)}%` }]} />
      </View>
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable style={styles.iconButton} onPress={() => safe(() => playback.seekBy(-0.75))}>
          <StepBack color={theme.colors.white} size={20} />
        </Pressable>
        <PartyButton
          compact
          title={playback.isPlaying ? t('pause') : t('play')}
          icon={playback.isPlaying ? Pause : Play}
          onPress={() => safe(playback.isPlaying ? playback.pause : playback.play)}
        />
        <Pressable style={styles.iconButton} onPress={() => safe(() => playback.seekBy(0.75))}>
          <StepForward color={theme.colors.white} size={20} />
        </Pressable>
        <PartyButton compact title={t('restart')} icon={RotateCcw} variant="ghost" onPress={() => safe(playback.restart)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.white,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: theme.colors.mint,
    height: 8,
  },
  row: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
