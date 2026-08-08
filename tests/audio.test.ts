import { compareWavBytes } from '../src/services/AudioSimilarityCore';
import { createToneWav, decodeWav, encodeWav, reverseWavData } from '../src/services/WavAudio';

test('reverses mono WAV samples from A B C D to D C B A', () => {
  const original = encodeWav({ sampleRate: 8000, channels: 1, bitsPerSample: 16, samples: new Int16Array([1, 2, 3, 4]) });
  const reversed = decodeWav(encodeWav(reverseWavData(decodeWav(original))));
  assert.deepEqual(Array.from(reversed.samples), [4, 3, 2, 1]);
});

test('reverses stereo WAV by frame while preserving channels', () => {
  const reversed = reverseWavData({
    sampleRate: 8000,
    channels: 2,
    bitsPerSample: 16,
    samples: new Int16Array([1, 10, 2, 20, 3, 30]),
  });
  assert.deepEqual(Array.from(reversed.samples), [3, 30, 2, 20, 1, 10]);
});

test('similarity returns high score for matching audio with different sample rates', () => {
  const target = createToneWav(440, 450, 16000, 0.2);
  const attempt = createToneWav(440, 450, 22050, 0.12);
  const result = compareWavBytes(target, attempt);
  assert.equal(result.score >= 70, true);
  assert.equal(result.score <= 100, true);
});

test('similarity score stays within bounds for silence and different tones', () => {
  const silence = encodeWav({ sampleRate: 8000, channels: 1, bitsPerSample: 16, samples: new Int16Array(1200) });
  const tone = createToneWav(880, 250, 8000, 0.2);
  const result = compareWavBytes(silence, tone);
  assert.equal(result.score >= 0, true);
  assert.equal(result.score <= 100, true);
});
