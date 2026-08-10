import { Check, Mic, Square, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Linking, StyleSheet, Text, View } from 'react-native';

import { AudioClipControls, type AudioClipControlsHandle } from './AudioClipControls';
import { Card } from './Card';
import { PartyButton } from './PartyButton';
import { WaveformBars } from './WaveformBars';
import { useTranslation } from '@/hooks/useTranslation';
import { deleteIfExists } from '@/services/AudioFileService';
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
  onConfirm: (result: RecordingResult) => void | Promise<void>;
};

type FinalizeReason = 'manual' | 'max-duration';

export function RecordingPanel({ title, prompt, maxDurationSeconds, playbackLabel, confirmLabel, onConfirm }: RecordingPanelProps) {
  const { t, isRTL } = useTranslation();
  const feedback = useFeedback();
  const quality = useSettingsStore((state) => state.recordingQuality);
  const recorder = useAudioRecordingService({ quality, maxDurationSeconds });
  const [countdown, setCountdown] = useState<number | 'go' | undefined>();
  const [isStopping, setIsStopping] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [micScale] = useState(() => new Animated.Value(1));
  const playbackRef = useRef<AudioClipControlsHandle>(null);
  const isStoppingRef = useRef(false);

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
    if (countdown !== undefined || recorder.status === 'recording' || recorder.status === 'stopping') {
      return;
    }
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

  const handleRecordingError = useCallback(
    (error: unknown) => {
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
    },
    [t],
  );

  const finalizeRecording = useCallback(
    async (reason: FinalizeReason) => {
      if (isStoppingRef.current || recorder.status !== 'recording') {
        return;
      }
      isStoppingRef.current = true;
      setIsStopping(true);
      try {
        const result = await recorder.stop();
        if (!result?.uri) {
          throw new Error('Recording URI was not returned.');
        }
        void feedback('recordStop');
      } catch (error) {
        handleRecordingError(error);
        recorder.reset();
      } finally {
        isStoppingRef.current = false;
        setIsStopping(false);
      }
    },
    [feedback, handleRecordingError, recorder],
  );

  useEffect(() => {
    if (recorder.status !== 'recording') {
      return;
    }
    if (recorder.durationMs >= maxDurationSeconds * 1000) {
      void finalizeRecording('max-duration');
    }
  }, [finalizeRecording, maxDurationSeconds, recorder.durationMs, recorder.status]);

  async function recordAgain() {
    const uri = recorder.result?.uri;
    try {
      playbackRef.current?.pause();
      await deleteIfExists(uri);
    } finally {
      setIsConfirming(false);
      recorder.reset();
    }
  }

  async function useRecording() {
    if (!recorder.result || isConfirming) {
      return;
    }
    try {
      playbackRef.current?.pause();
      setIsConfirming(true);
      await onConfirm(recorder.result);
    } catch (error) {
      setIsConfirming(false);
      handleRecordingError(error);
    }
  }

  const seconds = Math.min(maxDurationSeconds, recorder.durationMs / 1000);
  const progress = Math.min(1, seconds / maxDurationSeconds);
  const isCountdown = countdown !== undefined;
  const isRecording = recorder.status === 'recording';
  const isFinalizing = isStopping || recorder.status === 'stopping';
  const showActiveRecording = isRecording || isFinalizing;

  if (recorder.status === 'recorded' && recorder.result) {
    return (
      <Card tint="dark" style={styles.card}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{playbackLabel}</Text>
        <WaveformBars levels={recorder.result.levels} active={false} color={theme.colors.mint} />
        <Text style={styles.recordedDuration}>{formatDurationMs(recorder.result.durationMs)}</Text>
        <AudioClipControls ref={playbackRef} durationMs={recorder.result.durationMs} playLabel={t('playRecording')} uri={recorder.result.uri} />
        <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <PartyButton compact disabled={isConfirming} title={t('recordAgain')} icon={Mic} variant="secondary" onPress={recordAgain} />
          <PartyButton compact disabled={isConfirming} title={confirmLabel} icon={Check} variant="mint" onPress={useRecording} />
        </View>
      </Card>
    );
  }

  return (
    <Card tint="dark" style={styles.card}>
      <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{showActiveRecording ? t('recording') : title}</Text>
      {showActiveRecording ? null : <Text style={[styles.prompt, { textAlign: isRTL ? 'right' : 'left' }]}>{prompt}</Text>}

      <View style={styles.micStage}>
        <Animated.View style={[styles.micButton, { transform: [{ scale: micScale }] }]}>
          <Mic color={theme.colors.ink} size={58} strokeWidth={2.5} />
        </Animated.View>
        {countdown !== undefined ? <Text style={styles.countdown}>{countdown === 'go' ? t('recordNow') : countdown}</Text> : null}
      </View>

      <WaveformBars levels={recorder.levels} active={isRecording && !isFinalizing} color={isRecording && !isFinalizing ? theme.colors.coral : theme.colors.mint} />

      <View style={styles.timerWrap}>
        <Text style={styles.timer}>{seconds.toFixed(1)}s</Text>
        <Text style={styles.max}>{t('maxDuration', { seconds: maxDurationSeconds })}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>

      <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {showActiveRecording ? (
          <>
            <PartyButton compact disabled={isFinalizing} title={t('stop')} icon={Square} onPress={() => finalizeRecording('manual')} />
            <PartyButton compact disabled={isFinalizing} title={t('cancel')} icon={Trash2} variant="ghost" onPress={recorder.cancel} />
          </>
        ) : isCountdown ? (
          <PartyButton disabled title={countdown === 'go' ? t('recordNow') : t('getReady')} icon={Mic} />
        ) : (
          <PartyButton title={t('tapToRecord')} icon={Mic} onPress={startWithCountdown} />
        )}
      </View>
    </Card>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDurationMs(durationMs: number) {
  const totalTenths = Math.max(0, Math.round(durationMs / 100));
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
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
  recordedDuration: {
    color: theme.colors.mint,
    fontSize: theme.typography.h1,
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
  actions: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
});
