import { Mic, RefreshCw, Square, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Animated, Linking, StyleSheet, Text, View } from 'react-native';

import { AudioClipControls } from './AudioClipControls';
import { Card } from './Card';
import { PartyButton } from './PartyButton';
import { WaveformBars } from './WaveformBars';
import { useTranslation } from '@/hooks/useTranslation';
import { RecordingPermissionError, RecordingTooShortError, type RecordingResult, useAudioRecordingService } from '@/services/AudioRecordingService';
import { useSettingsStore } from '@/stores/settingsStore';
import { useFeedback } from '@/services/FeedbackService';
import { theme } from '@/theme';

type RecordingPanelProps = {
  title: string;
  prompt: string;
  maxDurationSeconds: number;
  playbackLabel: string;
  confirmLabel: string;
  onConfirm: (result: RecordingResult) => void;
};

export function RecordingPanel({ title, prompt, maxDurationSeconds, playbackLabel, confirmLabel, onConfirm }: RecordingPanelProps) {
  const { t, isRTL } = useTranslation();
  const feedback = useFeedback();
  const quality = useSettingsStore((state) => state.recordingQuality);
  const recorder = useAudioRecordingService({ quality, maxDurationSeconds });
  const [countdown, setCountdown] = useState<number | 'go' | undefined>();
  const [micScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!recorder.isRecording) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(micScale, { toValue: 1.08, duration: 360, useNativeDriver: true }),
        Animated.timing(micScale, { toValue: 1, duration: 360, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [micScale, recorder.isRecording]);

  async function startWithCountdown() {
    setCountdown(3);
    void feedback('countdown');
    await wait(420);
    setCountdown(2);
    void feedback('countdown');
    await wait(420);
    setCountdown(1);
    void feedback('countdown');
    await wait(420);
    setCountdown('go');
    await wait(260);
    setCountdown(undefined);
    try {
      void feedback('recordStart');
      await recorder.start();
    } catch (error) {
      handleRecordingError(error);
    }
  }

  async function stop() {
    try {
      await recorder.stop();
      void feedback('recordStop');
    } catch (error) {
      handleRecordingError(error);
    }
  }

  function handleRecordingError(error: unknown) {
    if (error instanceof RecordingPermissionError) {
      Alert.alert(t('microphoneDenied'), undefined, [
        { text: t('cancel') },
        { text: t('openSettings'), onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    if (error instanceof RecordingTooShortError) {
      Alert.alert(t('minimumRecording'));
      return;
    }
    Alert.alert(t('recordingFailed'));
  }

  const seconds = Math.min(maxDurationSeconds, recorder.durationMs / 1000);
  const progress = Math.min(1, seconds / maxDurationSeconds);

  return (
    <Card tint="dark" style={styles.card}>
      <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      <Text style={[styles.prompt, { textAlign: isRTL ? 'right' : 'left' }]}>{prompt}</Text>

      <View style={styles.micStage}>
        <Animated.View style={[styles.micButton, { transform: [{ scale: micScale }] }]}>
          <Mic color={theme.colors.ink} size={58} strokeWidth={2.5} />
        </Animated.View>
        {countdown !== undefined ? <Text style={styles.countdown}>{countdown === 'go' ? t('recordNow') : countdown}</Text> : null}
      </View>

      <WaveformBars levels={recorder.levels} active={recorder.isRecording} color={recorder.isRecording ? theme.colors.coral : theme.colors.mint} />

      <View style={styles.timerWrap}>
        <Text style={styles.timer}>{seconds.toFixed(1)}s</Text>
        <Text style={styles.max}>{t('maxDuration', { seconds: maxDurationSeconds })}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>

      {recorder.status === 'recorded' && recorder.result ? (
        <View style={styles.afterRecord}>
          <AudioClipControls uri={recorder.result.uri} label={playbackLabel} />
          <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <PartyButton compact title={t('recordAgain')} icon={RefreshCw} variant="secondary" onPress={recorder.reset} />
            <PartyButton compact title={confirmLabel} icon={Mic} variant="mint" onPress={() => onConfirm(recorder.result!)} />
          </View>
        </View>
      ) : (
        <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {recorder.isRecording ? (
            <>
              <PartyButton compact title={t('stop')} icon={Square} onPress={stop} />
              <PartyButton compact title={t('cancel')} icon={Trash2} variant="ghost" onPress={recorder.cancel} />
            </>
          ) : (
            <PartyButton title={t('tapToRecord')} icon={Mic} onPress={startWithCountdown} />
          )}
        </View>
      )}
    </Card>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.lg,
  },
  title: {
    color: theme.colors.white,
    fontSize: theme.typography.h2,
    fontWeight: '900',
    letterSpacing: 0,
  },
  prompt: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: theme.typography.body,
    fontWeight: '800',
    lineHeight: 23,
  },
  micStage: {
    alignItems: 'center',
    minHeight: 124,
    justifyContent: 'center',
  },
  micButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.lemon,
    borderRadius: 8,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  countdown: {
    color: theme.colors.white,
    fontSize: theme.typography.h1,
    fontWeight: '900',
    letterSpacing: 0,
    position: 'absolute',
    textAlign: 'center',
    textShadowColor: theme.colors.ink,
    textShadowRadius: 12,
  },
  timerWrap: {
    gap: theme.spacing.sm,
  },
  timer: {
    color: theme.colors.white,
    fontSize: theme.typography.h2,
    fontWeight: '900',
    textAlign: 'center',
  },
  max: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: theme.typography.small,
    fontWeight: '800',
    textAlign: 'center',
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: theme.colors.coral,
    height: 8,
  },
  afterRecord: {
    gap: theme.spacing.md,
  },
  actions: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
});
