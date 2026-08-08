import { readBytes } from './AudioFileService';
import { compareWavBytes } from './AudioSimilarityCore';
import type { AudioSimilarityResult } from '@/types';

export async function compareAudioFiles(targetUri: string, attemptUri: string): Promise<AudioSimilarityResult> {
  const [targetBytes, attemptBytes] = await Promise.all([readBytes(targetUri), readBytes(attemptUri)]);
  return compareWavBytes(targetBytes, attemptBytes);
}

export { compareSignals, compareWavBytes } from './AudioSimilarityCore';
