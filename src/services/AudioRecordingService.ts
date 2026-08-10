import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioQuality,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';

import { isRecordingDurationValid } from '@/utils/recordingValidation';
import type { RecordingQuality } from '@/types';

export type RecordingResult = {
  uri: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  levels: number[];
};

export type RecordingStatus = 'idle' | 'countdown' | 'recording' | 'recorded' | 'error';

export class RecordingPermissionError extends Error {}
export class RecordingTooShortError extends Error {}

type UseAudioRecordingServiceOptions = {
  quality: RecordingQuality;
  maxDurationSeconds: number;
  minDurationMs?: number;
};

export function useAudioRecordingService({ quality, maxDurationSeconds, minDurationMs = 500 }: UseAudioRecordingServiceOptions) {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [durationMs, setDurationMs] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const [result, setResult] = useState<RecordingResult | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestStopRef = useRef<(() => Promise<RecordingResult | undefined>) | undefined>(undefined);

  const requestedSampleRate = quality === 'high' ? 48000 : 24000;
  const bitRate = quality === 'high' ? 256000 : 128000;

  const recordingOptions = useMemo<RecordingOptions>(
    () => ({
      isMeteringEnabled: true,
      extension: '.wav',
      sampleRate: requestedSampleRate,
      numberOfChannels: 1,
      bitRate,
      ios: {
        extension: '.wav',
        outputFormat: IOSOutputFormat.LINEARPCM,
        audioQuality: quality === 'high' ? AudioQuality.MAX : AudioQuality.HIGH,
        sampleRate: requestedSampleRate,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      android: {
        extension: '.m4a',
        outputFormat: 'mpeg4',
        audioEncoder: 'aac',
      },
      web: {
        mimeType: 'audio/wav',
        bitsPerSecond: bitRate,
      },
    }),
    [bitRate, quality, requestedSampleRate],
  );
  const recorder = useAudioRecorder(recordingOptions);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = undefined;
    }
  }, []);

  const reset = useCallback(() => {
    setDurationMs(0);
    setLevels([]);
    setResult(undefined);
    setError(undefined);
    setStatus('idle');
  }, []);

  const stop = useCallback(async () => {
    if (status !== 'recording' && !recorder.isRecording) {
      return result;
    }
    clearTimers();
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    const recorderStatus = recorder.getStatus();
    const duration = recorderStatus.durationMillis || Date.now() - startedAtRef.current;
    setDurationMs(duration);
    if (!isRecordingDurationValid(duration, minDurationMs, maxDurationSeconds)) {
      const tooShort = new RecordingTooShortError('Recording is too short.');
      setError(tooShort);
      setStatus('error');
      throw tooShort;
    }
    const uri = recorder.uri ?? recorderStatus.url;
    if (!uri) {
      const recordingError = new Error('Recording failed to produce an audio file.');
      setError(recordingError);
      setStatus('error');
      throw recordingError;
    }
    const nextResult = {
      uri,
      durationMs: duration,
      sampleRate: requestedSampleRate,
      channels: 1,
      levels,
    };
    setResult(nextResult);
    setStatus('recorded');
    return nextResult;
  }, [clearTimers, levels, maxDurationSeconds, minDurationMs, recorder, requestedSampleRate, result, status]);

  useEffect(() => {
    latestStopRef.current = stop;
  }, [stop]);

  const start = useCallback(async () => {
    reset();
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      const permissionError = new RecordingPermissionError('Microphone permission denied.');
      setError(permissionError);
      setStatus('error');
      throw permissionError;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync(recordingOptions);
    setStatus('recording');
    startedAtRef.current = Date.now();
    recorder.record();
    timerRef.current = setInterval(() => {
      const recorderStatus = recorder.getStatus();
      const elapsed = recorderStatus.durationMillis || Date.now() - startedAtRef.current;
      setDurationMs(elapsed);
      setLevels((current) => [...current.slice(-23), meteringToLevel(recorderStatus.metering, elapsed)]);
    }, 80);
    stopTimeoutRef.current = setTimeout(() => {
      void latestStopRef.current?.();
    }, maxDurationSeconds * 1000);
  }, [maxDurationSeconds, recorder, recordingOptions, reset]);

  const cancel = useCallback(async () => {
    clearTimers();
    if (recorder.isRecording) {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    }
    reset();
  }, [clearTimers, recorder, reset]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    status,
    isStreaming: recorder.isRecording,
    isRecording: status === 'recording',
    durationMs,
    levels,
    result,
    error,
    start,
    stop,
    cancel,
    reset,
  };
}

function meteringToLevel(metering: number | undefined, elapsedMs: number) {
  if (typeof metering === 'number' && Number.isFinite(metering)) {
    return Math.max(0.04, Math.min(1, (metering + 60) / 60));
  }
  return 0.18 + Math.abs(Math.sin(elapsedMs / 140)) * 0.56;
}
