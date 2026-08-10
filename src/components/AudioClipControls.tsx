import { forwardRef, useImperativeHandle } from 'react';
import { Pause, Play, StepBack, StepForward } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PartyButton } from './PartyButton';
import { useTranslation } from '@/hooks/useTranslation';
import { useAudioPlaybackService } from '@/services/AudioPlaybackService';
import { theme } from '@/theme';

type AudioClipControlsProps = {
  uri?: string;
  label?: string;
  durationMs?: number;
  playLabel?: string;
};

export type AudioClipControlsHandle = {
  pause: () => void;
};

export const AudioClipControls = forwardRef<AudioClipControlsHandle, AudioClipControlsProps>(function AudioClipControls(
  { uri, label, durationMs, playLabel },
  ref,
) {
  const { t, isRTL } = useTranslation();
  const playback = useAudioPlaybackService(uri);
  const totalSeconds = playback.status.duration > 0 ? playback.status.duration : (durationMs ?? 0) / 1000;
  const currentSeconds = Math.min(totalSeconds, playback.status.currentTime || 0);
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, currentSeconds / totalSeconds)) : playback.progress;

  useImperativeHandle(ref, () => ({ pause: playback.pause }), [playback.pause]);

  async function safe(action: () => void | Promise<void>) {
    try {
      await action();
    } catch {
      Alert.alert(t('playbackFailed'));
    }
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text> : null}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <View style={[styles.timeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={styles.timeText}>
          {formatTime(currentSeconds)} / {formatTime(totalSeconds)}
        </Text>
        <Text style={styles.timeText}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable style={styles.iconButton} onPress={() => safe(() => playback.seekBy(-0.75))}>
          <StepBack color={theme.colors.white} size={20} />
        </Pressable>
        <PartyButton
          compact
          title={playback.isPlaying ? t('pause') : playLabel ?? t('play')}
          icon={playback.isPlaying ? Pause : Play}
          onPress={() => safe(playback.isPlaying ? playback.pause : playback.play)}
        />
        <Pressable style={styles.iconButton} onPress={() => safe(() => playback.seekBy(0.75))}>
          <StepForward color={theme.colors.white} size={20} />
        </Pressable>
      </View>
    </View>
  );
});

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
  timeRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: theme.typography.small,
    fontWeight: '800',
  },
  row: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
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

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }
  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}
