import { decodeWav, mixToMono, normalizeFloat, resampleLinear, trimSilence } from './WavAudio';
import type { AudioSimilarityResult } from '@/types';

const ANALYSIS_RATE = 12000;
const FRAME_SIZE = 512;
const HOP_SIZE = 256;
const MEL_BANDS = 20;
const MFCC_COEFFS = 12;

export function compareWavBytes(targetBytes: Uint8Array, attemptBytes: Uint8Array): AudioSimilarityResult {
  const target = prepareSignal(targetBytes);
  const attempt = prepareSignal(attemptBytes);
  return compareSignals(target.samples, attempt.samples, target.sampleRate);
}

export function compareSignals(targetSamples: Float32Array, attemptSamples: Float32Array, sampleRate = ANALYSIS_RATE): AudioSimilarityResult {
  const target = normalizeFloat(trimSilence(targetSamples));
  const attempt = normalizeFloat(trimSilence(attemptSamples));
  const targetEnergy = rms(target);
  const attemptEnergy = rms(attempt);

  if (targetEnergy < 0.002 && attemptEnergy < 0.002) {
    return {
      score: 100,
      confidence: 0.45,
      details: { mfccSimilarity: 100, spectralSimilarity: 100, timingSimilarity: 100, energySimilarity: 100 },
    };
  }
  if (targetEnergy < 0.002 || attemptEnergy < 0.002) {
    return {
      score: 6,
      confidence: 0.35,
      details: { mfccSimilarity: 0, spectralSimilarity: 0, timingSimilarity: 0, energySimilarity: 25 },
    };
  }

  const targetFeatures = extractFeatures(target, sampleRate);
  const attemptFeatures = extractFeatures(attempt, sampleRate);
  const mfccDistance = dtwDistance(targetFeatures.mfcc, attemptFeatures.mfcc);
  const spectralDistance = dtwDistance(targetFeatures.spectral, attemptFeatures.spectral);
  const mfccSimilarity = distanceToSimilarity(mfccDistance, 2.4);
  const spectralSimilarity = distanceToSimilarity(spectralDistance, 1.7);
  const timingSimilarity = timingScore(target.length, attempt.length);
  const energySimilarity = energyScore(targetFeatures.energy, attemptFeatures.energy);
  const score =
    mfccSimilarity * 0.48 +
    spectralSimilarity * 0.26 +
    timingSimilarity * 0.14 +
    energySimilarity * 0.12;
  const confidence = Math.max(
    0.25,
    Math.min(0.98, Math.min(targetFeatures.mfcc.length, attemptFeatures.mfcc.length) / Math.max(targetFeatures.mfcc.length, attemptFeatures.mfcc.length, 1)),
  );

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    confidence,
    details: {
      mfccSimilarity: Math.round(mfccSimilarity),
      spectralSimilarity: Math.round(spectralSimilarity),
      timingSimilarity: Math.round(timingSimilarity),
      energySimilarity: Math.round(energySimilarity),
    },
  };
}

function prepareSignal(bytes: Uint8Array) {
  const wav = decodeWav(bytes);
  const mono = mixToMono(wav);
  return {
    sampleRate: ANALYSIS_RATE,
    samples: resampleLinear(mono, wav.sampleRate, ANALYSIS_RATE),
  };
}

function extractFeatures(samples: Float32Array, sampleRate: number) {
  const windows = createFrames(samples, FRAME_SIZE, HOP_SIZE);
  const melFilters = createMelFilters(MEL_BANDS, FRAME_SIZE, sampleRate);
  const mfcc: number[][] = [];
  const spectral: number[][] = [];
  const energy: number[] = [];

  for (const frame of windows) {
    const spectrum = magnitudeSpectrum(frame);
    const mel = melFilters.map((filter) => {
      let sum = 0;
      for (let index = 0; index < filter.length; index += 1) {
        sum += spectrum[index] * filter[index];
      }
      return Math.log(1e-8 + sum);
    });
    mfcc.push(dct(mel, MFCC_COEFFS));
    spectral.push([
      spectralCentroid(spectrum, sampleRate),
      spectralRolloff(spectrum, sampleRate),
      spectralFlatness(spectrum),
      zeroCrossingRate(frame),
    ]);
    energy.push(rms(frame));
  }

  return { mfcc: standardizeVectors(mfcc), spectral: standardizeVectors(spectral), energy };
}

function createFrames(samples: Float32Array, frameSize: number, hopSize: number) {
  if (samples.length <= frameSize) {
    return [applyHann(padFrame(samples, frameSize))];
  }
  const frames: Float32Array[] = [];
  for (let start = 0; start + frameSize <= samples.length; start += hopSize) {
    frames.push(applyHann(samples.slice(start, start + frameSize)));
  }
  return frames;
}

function padFrame(samples: Float32Array, frameSize: number) {
  const frame = new Float32Array(frameSize);
  frame.set(samples.slice(0, frameSize));
  return frame;
}

function applyHann(frame: Float32Array) {
  const output = new Float32Array(frame.length);
  for (let index = 0; index < frame.length; index += 1) {
    output[index] = frame[index] * (0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (frame.length - 1)));
  }
  return output;
}

function magnitudeSpectrum(frame: Float32Array) {
  const bins = frame.length / 2;
  const spectrum = new Float32Array(bins);
  for (let bin = 0; bin < bins; bin += 1) {
    let real = 0;
    let imag = 0;
    for (let index = 0; index < frame.length; index += 1) {
      const angle = (2 * Math.PI * bin * index) / frame.length;
      real += frame[index] * Math.cos(angle);
      imag -= frame[index] * Math.sin(angle);
    }
    spectrum[bin] = Math.sqrt(real * real + imag * imag) / frame.length;
  }
  return spectrum;
}

function createMelFilters(count: number, frameSize: number, sampleRate: number) {
  const bins = frameSize / 2;
  const minMel = hzToMel(80);
  const maxMel = hzToMel(sampleRate / 2);
  const melPoints = Array.from({ length: count + 2 }, (_, index) => minMel + ((maxMel - minMel) * index) / (count + 1));
  const hzPoints = melPoints.map(melToHz);
  const binPoints = hzPoints.map((hz) => Math.min(bins - 1, Math.floor((hz / sampleRate) * frameSize)));

  return Array.from({ length: count }, (_, filterIndex) => {
    const filter = new Float32Array(bins);
    const left = binPoints[filterIndex];
    const center = Math.max(left + 1, binPoints[filterIndex + 1]);
    const right = Math.max(center + 1, binPoints[filterIndex + 2]);
    for (let bin = left; bin < center; bin += 1) {
      filter[bin] = (bin - left) / Math.max(1, center - left);
    }
    for (let bin = center; bin < right && bin < bins; bin += 1) {
      filter[bin] = (right - bin) / Math.max(1, right - center);
    }
    return filter;
  });
}

function dct(values: number[], count: number) {
  return Array.from({ length: count }, (_, coefficient) => {
    let sum = 0;
    for (let index = 0; index < values.length; index += 1) {
      sum += values[index] * Math.cos((Math.PI * coefficient * (index + 0.5)) / values.length);
    }
    return sum;
  });
}

function standardizeVectors(vectors: number[][]) {
  if (!vectors.length) {
    return vectors;
  }
  const dimensions = vectors[0].length;
  const means = Array(dimensions).fill(0);
  const deviations = Array(dimensions).fill(0);
  for (const vector of vectors) {
    for (let dimension = 0; dimension < dimensions; dimension += 1) {
      means[dimension] += vector[dimension];
    }
  }
  for (let dimension = 0; dimension < dimensions; dimension += 1) {
    means[dimension] /= vectors.length;
  }
  for (const vector of vectors) {
    for (let dimension = 0; dimension < dimensions; dimension += 1) {
      const delta = vector[dimension] - means[dimension];
      deviations[dimension] += delta * delta;
    }
  }
  for (let dimension = 0; dimension < dimensions; dimension += 1) {
    deviations[dimension] = Math.sqrt(deviations[dimension] / vectors.length) || 1;
  }
  return vectors.map((vector) => vector.map((value, dimension) => (value - means[dimension]) / deviations[dimension]));
}

function dtwDistance(left: number[][], right: number[][]) {
  if (!left.length || !right.length) {
    return Number.POSITIVE_INFINITY;
  }
  const rows = left.length + 1;
  const cols = right.length + 1;
  const previous = new Float64Array(cols).fill(Number.POSITIVE_INFINITY);
  const current = new Float64Array(cols).fill(Number.POSITIVE_INFINITY);
  previous[0] = 0;

  for (let row = 1; row < rows; row += 1) {
    current[0] = Number.POSITIVE_INFINITY;
    for (let col = 1; col < cols; col += 1) {
      const cost = euclidean(left[row - 1], right[col - 1]);
      current[col] = cost + Math.min(previous[col], current[col - 1], previous[col - 1]);
    }
    previous.set(current);
  }
  return previous[cols - 1] / (left.length + right.length);
}

function euclidean(left: number[], right: number[]) {
  let sum = 0;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    const delta = left[index] - right[index];
    sum += delta * delta;
  }
  return Math.sqrt(sum / Math.max(1, Math.min(left.length, right.length)));
}

function distanceToSimilarity(distance: number, softness: number) {
  if (!Number.isFinite(distance)) {
    return 0;
  }
  return Math.max(0, Math.min(100, 100 * Math.exp(-distance / softness)));
}

function timingScore(leftLength: number, rightLength: number) {
  const ratio = Math.min(leftLength, rightLength) / Math.max(leftLength, rightLength, 1);
  return Math.max(0, Math.min(100, ratio * 100));
}

function energyScore(left: number[], right: number[]) {
  if (!left.length || !right.length) {
    return 0;
  }
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  const ratio = Math.min(leftMean, rightMean) / Math.max(leftMean, rightMean, 1e-8);
  return Math.max(0, Math.min(100, ratio * 100));
}

function spectralCentroid(spectrum: Float32Array, sampleRate: number) {
  let weighted = 0;
  let total = 0;
  for (let index = 0; index < spectrum.length; index += 1) {
    const frequency = (index * sampleRate) / (spectrum.length * 2);
    weighted += frequency * spectrum[index];
    total += spectrum[index];
  }
  return total > 0 ? weighted / total / (sampleRate / 2) : 0;
}

function spectralRolloff(spectrum: Float32Array, sampleRate: number) {
  const total = spectrum.reduce((sum, value) => sum + value, 0);
  const threshold = total * 0.85;
  let cumulative = 0;
  for (let index = 0; index < spectrum.length; index += 1) {
    cumulative += spectrum[index];
    if (cumulative >= threshold) {
      return ((index * sampleRate) / (spectrum.length * 2)) / (sampleRate / 2);
    }
  }
  return 1;
}

function spectralFlatness(spectrum: Float32Array) {
  let logSum = 0;
  let linearSum = 0;
  for (let index = 0; index < spectrum.length; index += 1) {
    const value = Math.max(1e-10, spectrum[index]);
    logSum += Math.log(value);
    linearSum += value;
  }
  const geometric = Math.exp(logSum / spectrum.length);
  const arithmetic = linearSum / spectrum.length;
  return arithmetic > 0 ? geometric / arithmetic : 0;
}

function zeroCrossingRate(frame: Float32Array) {
  let crossings = 0;
  for (let index = 1; index < frame.length; index += 1) {
    if ((frame[index - 1] >= 0 && frame[index] < 0) || (frame[index - 1] < 0 && frame[index] >= 0)) {
      crossings += 1;
    }
  }
  return crossings / frame.length;
}

function rms(samples: Float32Array | number[]) {
  if (!samples.length) {
    return 0;
  }
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    sum += samples[index] * samples[index];
  }
  return Math.sqrt(sum / samples.length);
}

function hzToMel(hz: number) {
  return 2595 * Math.log10(1 + hz / 700);
}

function melToHz(mel: number) {
  return 700 * (10 ** (mel / 2595) - 1);
}
