import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioQuality,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type AudioRecorder,
  type RecordingOptions,
  type RecorderState,
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

export type RecordingStatus = 'idle' | 'countdown' | 'recording' | 'stopping' | 'recorded' | 'error';

export class RecordingPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecordingPermissionError';
    Object.setPrototypeOf(this, RecordingPermissionError.prototype);
  }
}

export class RecordingTooShortError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecordingTooShortError';
    Object.setPrototypeOf(this, RecordingTooShortError.prototype);
  }
}

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
  const levelsRef = useRef<number[]>([]);
  const finishingRef = useRef(false);
  const previousRecordingUriRef = useRef<string | undefined>(undefined);
  const statusRef = useRef<RecordingStatus>('idle');
  const stopPromiseRef = useRef<Promise<RecordingResult | undefined> | undefined>(undefined);

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

  useEffect(() => {
    levelsRef.current = levels;
  }, [levels]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const reset = useCallback(() => {
    setDurationMs(0);
    setLevels([]);
    setResult(undefined);
    setError(undefined);
    statusRef.current = 'idle';
    setStatus('idle');
  }, []);

  const stop = useCallback(async (finalDurationMs?: number) => {
    if (stopPromiseRef.current) {
      return stopPromiseRef.current;
    }
    if (finishingRef.current) {
      return result;
    }
    if (statusRef.current !== 'recording' && !recorder.isRecording) {
      return result;
    }
    const stopPromise = (async () => {
      finishingRef.current = true;
      statusRef.current = 'stopping';
      setStatus('stopping');
      clearTimers();
      try {
        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
        const recorderStatus = await waitForRecordingFile(recorder, previousRecordingUriRef.current);
        const rawDuration = finalDurationMs ?? (recorderStatus.durationMillis || Date.now() - startedAtRef.current);
        const duration = Math.min(rawDuration, maxDurationSeconds * 1000);
        setDurationMs(duration);
        if (!isRecordingDurationValid(duration, minDurationMs, maxDurationSeconds)) {
          const tooShort = new RecordingTooShortError('Recording is too short.');
          setError(tooShort);
          statusRef.current = 'error';
          setStatus('error');
          throw tooShort;
        }
        const uri = getNewRecordingUri(recorder, recorderStatus, previousRecordingUriRef.current);
        if (!uri) {
          const recordingError = new Error('Recording failed to produce an audio file.');
          setError(recordingError);
          statusRef.current = 'error';
          setStatus('error');
          throw recordingError;
        }
        const nextResult = {
          uri,
          durationMs: duration,
          sampleRate: requestedSampleRate,
          channels: 1,
          levels: levelsRef.current,
        };
        setResult(nextResult);
        setError(undefined);
        statusRef.current = 'recorded';
        setStatus('recorded');
        return nextResult;
      } finally {
        finishingRef.current = false;
        stopPromiseRef.current = undefined;
      }
    })();
    stopPromiseRef.current = stopPromise;
    return stopPromise;
  }, [clearTimers, maxDurationSeconds, minDurationMs, recorder, requestedSampleRate, result]);

  const start = useCallback(async () => {
    reset();
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      const permissionError = new RecordingPermissionError('Microphone permission denied.');
      setError(permissionError);
      statusRef.current = 'error';
      setStatus('error');
      throw permissionError;
    }
    previousRecordingUriRef.current = recorder.uri ?? recorder.getStatus().url ?? undefined;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync(recordingOptions);
    statusRef.current = 'recording';
    setStatus('recording');
    startedAtRef.current = Date.now();
    recorder.record();
    timerRef.current = setInterval(() => {
      const recorderStatus = recorder.getStatus();
      const rawElapsed = recorderStatus.durationMillis || Date.now() - startedAtRef.current;
      const elapsed = Math.min(rawElapsed, maxDurationSeconds * 1000);
      setDurationMs(elapsed);
      setLevels((current) => {
        const nextLevels = [...current.slice(-23), meteringToLevel(recorderStatus.metering, elapsed)];
        levelsRef.current = nextLevels;
        return nextLevels;
      });
    }, 80);
  }, [maxDurationSeconds, recorder, recordingOptions, reset]);

  const cancel = useCallback(async () => {
    clearTimers();
    if (recorder.isRecording) {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    }
    reset();
  }, [clearTimers, recorder, reset]);

  useEffect(
    () => () => {
      clearTimers();
      if (recorder.isRecording) {
        void recorder.stop().finally(() => {
          void setAudioModeAsync({ allowsRecording: false });
        });
      }
    },
    [clearTimers, recorder],
  );

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

async function waitForRecordingFile(recorder: AudioRecorder, previousUri?: string) {
  let status: RecorderState = recorder.getStatus();
  for (let attempt = 0; attempt < 12 && !getNewRecordingUri(recorder, status, previousUri); attempt += 1) {
    await wait(50);
    status = recorder.getStatus();
  }
  return status;
}

function getNewRecordingUri(recorder: AudioRecorder, status: RecorderState, previousUri?: string) {
  const uri = recorder.uri ?? status.url ?? undefined;
  return uri && uri !== previousUri ? uri : undefined;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
