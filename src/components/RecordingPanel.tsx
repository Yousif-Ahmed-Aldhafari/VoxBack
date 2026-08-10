import { Check, Mic, Square, Trash2 } from 'lucide-react-native';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
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

export type RecordingPanelHandle = {
  prepareToLeave: () => Promise<void>;
};

type CountdownValue = 3 | 2 | 1;
type FinalizeReason = 'manual' | 'max-duration';
type PanelRecordingState = 'idle' | 'countdown' | 'recording' | 'stopping' | 'recorded' | 'error';

const COUNTDOWN_STEPS: CountdownValue[] = [3, 2, 1];
const COUNTDOWN_STEP_MS = 1000;
const COUNTDOWN_ANIMATION_MS = 260;
const COUNTDOWN_WAVEFORM_OPACITY = 0.2;

export const RecordingPanel = forwardRef<RecordingPanelHandle, RecordingPanelProps>(function RecordingPanel(
  { title, prompt, maxDurationSeconds, playbackLabel, confirmLabel, onConfirm },
  ref,
) {
  const { t, isRTL } = useTranslation();
  const feedback = useFeedback();
  const quality = useSettingsStore((state) => state.recordingQuality);
  const recorder = useAudioRecordingService({ quality, maxDurationSeconds });
  const [countdown, setCountdown] = useState<CountdownValue | undefined>();
  const [isStopping, setIsStopping] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [micScale] = useState(() => new Animated.Value(1));
  const [countdownAnim] = useState(() => new Animated.Value(0));
  const playbackRef = useRef<AudioClipControlsHandle>(null);
  const isStoppingRef = useRef(false);
  const countdownRunRef = useRef(0);
  const isCountdownRunningRef = useRef(false);
  const isMountedRef = useRef(true);
  const isLeavingRef = useRef(false);
  const startPromiseRef = useRef<Promise<void> | undefined>(undefined);

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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isCountdownRunningRef.current = false;
      countdownRunRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (countdown === undefined) {
      return;
    }
    countdownAnim.stopAnimation();
    countdownAnim.setValue(0);
    Animated.timing(countdownAnim, {
      toValue: 1,
      duration: COUNTDOWN_ANIMATION_MS,
      useNativeDriver: true,
    }).start();
  }, [countdown, countdownAnim]);

  async function startWithCountdown() {
    if (
      isLeavingRef.current ||
      isCountdownRunningRef.current ||
      recorder.status === 'recording' ||
      recorder.status === 'stopping' ||
      recorder.status === 'recorded'
    ) {
      return;
    }
    const runId = countdownRunRef.current + 1;
    countdownRunRef.current = runId;
    isCountdownRunningRef.current = true;
    try {
      for (const step of COUNTDOWN_STEPS) {
        if (!isCountdownRunActive(runId)) {
          return;
        }
        setCountdown(step);
        void feedback('countdown');
        await wait(COUNTDOWN_STEP_MS);
      }
      if (!isCountdownRunActive(runId)) {
        return;
      }
      setCountdown(undefined);
      const startPromise = recorder.start();
      startPromiseRef.current = startPromise;
      await startPromise;
      if (startPromiseRef.current === startPromise) {
        startPromiseRef.current = undefined;
      }
      if (!isCountdownRunActive(runId)) {
        await recorder.cancel();
        return;
      }
      if (isCountdownRunActive(runId)) {
        void feedback('recordStart');
      }
    } catch (error) {
      if (isCountdownRunActive(runId)) {
        handleRecordingError(error);
      }
    } finally {
      if (isCountdownRunActive(runId)) {
        setCountdown(undefined);
      }
      isCountdownRunningRef.current = false;
    }
  }

  function isCountdownRunActive(runId: number) {
    return isMountedRef.current && !isLeavingRef.current && countdownRunRef.current === runId;
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
      if (isLeavingRef.current || isStoppingRef.current || recorder.status !== 'recording') {
        return;
      }
      isStoppingRef.current = true;
      setIsStopping(true);
      try {
        const result = await recorder.stop(reason === 'max-duration' ? maxDurationSeconds * 1000 : undefined);
        if (isLeavingRef.current) {
          return;
        }
        if (!result?.uri) {
          throw new Error('Recording URI was not returned.');
        }
        void feedback('recordStop');
      } catch (error) {
        if (isLeavingRef.current) {
          return;
        }
        handleRecordingError(error);
        recorder.reset();
      } finally {
        isStoppingRef.current = false;
        if (isMountedRef.current && !isLeavingRef.current) {
          setIsStopping(false);
        }
      }
    },
    [feedback, handleRecordingError, maxDurationSeconds, recorder],
  );

  const prepareToLeave = useCallback(async () => {
    if (isLeavingRef.current) {
      return;
    }
    isLeavingRef.current = true;
    countdownRunRef.current += 1;
    isCountdownRunningRef.current = false;
    countdownAnim.stopAnimation();
    playbackRef.current?.pause();
    if (isMountedRef.current) {
      setCountdown(undefined);
      setIsStopping(false);
      setIsConfirming(false);
    }
    await startPromiseRef.current?.catch(() => undefined);
    startPromiseRef.current = undefined;
    await recorder.cancel().catch(() => undefined);
    await deleteIfExists(recorder.result?.uri).catch(() => undefined);
  }, [countdownAnim, recorder]);

  useImperativeHandle(ref, () => ({ prepareToLeave }), [prepareToLeave]);

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

  const displayedDurationMs = Math.min(maxDurationSeconds * 1000, recorder.durationMs);
  const seconds = displayedDurationMs / 1000;
  const progress = Math.min(1, seconds / maxDurationSeconds);
  const recordingState: PanelRecordingState = countdown !== undefined ? 'countdown' : isStopping ? 'stopping' : recorder.status;
  const isCountdown = recordingState === 'countdown';
  const isRecording = recordingState === 'recording';
  const isFinalizing = recordingState === 'stopping';
  const showActiveRecording = isRecording || isFinalizing;
  const countdownScale = countdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });
  const countdownOpacity = countdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (recorder.status === 'recorded' && recorder.result) {
    return (
      <Card tint="dark" style={styles.card}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{playbackLabel}</Text>
        <WaveformBars levels={recorder.result.levels} active={false} color={theme.colors.mint} />
        <Text style={styles.recordedDuration}>{formatClockMs(recorder.result.durationMs)}</Text>
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
      </View>

      <View style={styles.waveformStage}>
        <Animated.View style={[styles.waveformLayer, { opacity: isCountdown ? COUNTDOWN_WAVEFORM_OPACITY : 1 }]}>
          <WaveformBars levels={recorder.levels} active={isRecording && !isFinalizing} color={isRecording && !isFinalizing ? theme.colors.coral : theme.colors.mint} />
        </Animated.View>
        {isCountdown ? (
          <Animated.Text
            style={[
              styles.countdown,
              {
                opacity: countdownOpacity,
                transform: [{ scale: countdownScale }],
              },
            ]}
          >
            {countdown}
          </Animated.Text>
        ) : null}
      </View>

      <View style={styles.timerWrap}>
        <Text style={styles.timer}>{formatClockMs(displayedDurationMs)}</Text>
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
        ) : (
          <PartyButton title={t('tapToRecord')} icon={Mic} onPress={startWithCountdown} />
        )}
      </View>
    </Card>
  );
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatClockMs(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
  waveformStage: {
    alignItems: 'center',
    height: 112,
    justifyContent: 'center',
    position: 'relative',
  },
  waveformLayer: {
    alignSelf: 'stretch',
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
    fontSize: 56,
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
