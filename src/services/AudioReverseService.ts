import { readBytes, writeBytesToCache } from './AudioFileService';
import { decodeWav, encodeWav, reverseWavData, type WavAudioData } from './WavAudio';

export type AudioReverseResult = {
  uri: string;
  sampleRate: number;
  channels: number;
  durationMs: number;
};

export async function reverseAudioFile(uri: string, prefix = 'reversed'): Promise<AudioReverseResult> {
  const bytes = await readBytes(uri);
  const decoded = decodeWav(bytes);
  const reversed = reverseWavData(decoded);
  const output = encodeWav(reversed);
  const reversedUri = await writeBytesToCache(output, prefix);
  return {
    uri: reversedUri,
    sampleRate: reversed.sampleRate,
    channels: reversed.channels,
    durationMs: getDurationMs(reversed),
  };
}

export function reverseWavBytes(bytes: Uint8Array) {
  return encodeWav(reverseWavData(decodeWav(bytes)));
}

export function getDurationMs(data: WavAudioData) {
  const frameCount = Math.floor(data.samples.length / data.channels);
  return Math.round((frameCount / data.sampleRate) * 1000);
}
