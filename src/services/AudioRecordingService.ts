import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requestRecordingPermissionsAsync, useAudioStream } from 'expo-audio';

import { writeBytesToCache } from './AudioFileService';
import { calculateRms, concatenateInt16, encodeWav } from './WavAudio';
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
  const chunksRef = useRef<Int16Array[]>([]);
  const sampleRateRef = useRef(quality === 'high' ? 48000 : 24000);
  const channelsRef = useRef(1);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestStopRef = useRef<(() => Promise<RecordingResult | undefined>) | undefined>(undefined);

  const requestedSampleRate = quality === 'high' ? 48000 : 24000;

  const onBuffer = useCallback((buffer: { data: ArrayBuffer; sampleRate: number; channels: number }) => {
    const chunk = new Int16Array(buffer.data.slice(0));
    chunksRef.current.push(chunk);
    sampleRateRef.current = buffer.sampleRate;
    channelsRef.current = buffer.channels;
    const rms = calculateRms(chunk);
    setLevels((current) => [...current.slice(-23), Math.min(1, rms * 14)]);
  }, []);

  const { stream, isStreaming } = useAudioStream(
    useMemo(
      () => ({
        sampleRate: requestedSampleRate,
        channels: 1,
        encoding: 'int16' as const,
        onBuffer,
      }),
      [onBuffer, requestedSampleRate],
    ),
  );

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
    chunksRef.current = [];
    setDurationMs(0);
    setLevels([]);
    setResult(undefined);
    setError(undefined);
    setStatus('idle');
  }, []);

  const stop = useCallback(async () => {
    if (status !== 'recording' && !stream.isStreaming) {
      return result;
    }
    clearTimers();
    stream.stop();
    const duration = Date.now() - startedAtRef.current;
    setDurationMs(duration);
    if (!isRecordingDurationValid(duration, minDurationMs, maxDurationSeconds)) {
      const tooShort = new RecordingTooShortError('Recording is too short.');
      setError(tooShort);
      setStatus('error');
      throw tooShort;
    }
    const samples = concatenateInt16(chunksRef.current);
    const bytes = encodeWav({
      sampleRate: sampleRateRef.current,
      channels: channelsRef.current,
      bitsPerSample: 16,
      samples,
    });
    const uri = await writeBytesToCache(bytes, 'recording');
    const nextResult = {
      uri,
      durationMs: duration,
      sampleRate: sampleRateRef.current,
      channels: channelsRef.current,
      levels,
    };
    setResult(nextResult);
    setStatus('recorded');
    return nextResult;
  }, [clearTimers, levels, minDurationMs, result, status, stream]);

  latestStopRef.current = stop;

  const start = useCallback(async () => {
    reset();
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      const permissionError = new RecordingPermissionError('Microphone permission denied.');
      setError(permissionError);
      setStatus('error');
      throw permissionError;
    }
    setStatus('recording');
    startedAtRef.current = Date.now();
    await stream.start();
    timerRef.current = setInterval(() => {
      setDurationMs(Date.now() - startedAtRef.current);
    }, 80);
    stopTimeoutRef.current = setTimeout(() => {
      void latestStopRef.current?.();
    }, maxDurationSeconds * 1000);
  }, [maxDurationSeconds, reset, stream]);

  const cancel = useCallback(() => {
    clearTimers();
    if (stream.isStreaming) {
      stream.stop();
    }
    reset();
  }, [clearTimers, reset, stream]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    status,
    isStreaming,
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
