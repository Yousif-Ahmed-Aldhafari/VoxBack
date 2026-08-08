export type WavAudioData = {
  sampleRate: number;
  channels: number;
  bitsPerSample: 16;
  samples: Int16Array;
};

export function concatenateInt16(chunks: Int16Array[]) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Int16Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return combined;
}

export function calculateRms(samples: Int16Array) {
  if (samples.length === 0) {
    return 0;
  }
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const normalized = samples[index] / 32768;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / samples.length);
}

export function encodeWav({ sampleRate, channels, samples }: WavAudioData) {
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    view.setInt16(offset, samples[index], true);
    offset += bytesPerSample;
  }

  return new Uint8Array(buffer);
}

export function decodeWav(bytes: Uint8Array): WavAudioData {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (readAscii(view, 0, 4) !== 'RIFF' || readAscii(view, 8, 4) !== 'WAVE') {
    throw new Error('Invalid WAV file.');
  }

  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let audioFormat = 0;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= view.byteLength) {
    const chunkId = readAscii(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;
    if (chunkId === 'fmt ') {
      audioFormat = view.getUint16(chunkDataOffset, true);
      channels = view.getUint16(chunkDataOffset + 2, true);
      sampleRate = view.getUint32(chunkDataOffset + 4, true);
      bitsPerSample = view.getUint16(chunkDataOffset + 14, true);
    }
    if (chunkId === 'data') {
      dataOffset = chunkDataOffset;
      dataSize = chunkSize;
      break;
    }
    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (audioFormat !== 1 || bitsPerSample !== 16 || channels < 1 || sampleRate < 1 || dataOffset < 0) {
    throw new Error('Only 16-bit PCM WAV files are supported.');
  }

  const sampleCount = Math.floor(dataSize / 2);
  const samples = new Int16Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = view.getInt16(dataOffset + index * 2, true);
  }
  return { sampleRate, channels, bitsPerSample: 16, samples };
}

export function reverseWavData(data: WavAudioData): WavAudioData {
  const frameCount = Math.floor(data.samples.length / data.channels);
  const reversed = new Int16Array(frameCount * data.channels);
  for (let frame = 0; frame < frameCount; frame += 1) {
    const targetFrame = frameCount - frame - 1;
    for (let channel = 0; channel < data.channels; channel += 1) {
      reversed[targetFrame * data.channels + channel] = data.samples[frame * data.channels + channel];
    }
  }
  return { ...data, samples: reversed };
}

export function int16ToFloat32(samples: Int16Array) {
  const output = new Float32Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    output[index] = Math.max(-1, samples[index] / 32768);
  }
  return output;
}

export function float32ToInt16(samples: Float32Array) {
  const output = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index]));
    output[index] = value < 0 ? Math.round(value * 32768) : Math.round(value * 32767);
  }
  return output;
}

export function mixToMono(data: WavAudioData) {
  const frameCount = Math.floor(data.samples.length / data.channels);
  const output = new Float32Array(frameCount);
  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < data.channels; channel += 1) {
      sum += data.samples[frame * data.channels + channel] / 32768;
    }
    output[frame] = sum / data.channels;
  }
  return output;
}

export function normalizeFloat(samples: Float32Array, targetRms = 0.12) {
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    sum += samples[index] * samples[index];
  }
  const rms = Math.sqrt(sum / Math.max(1, samples.length));
  if (rms < 0.000001) {
    return samples.slice();
  }
  const gain = Math.min(8, targetRms / rms);
  const output = new Float32Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    output[index] = Math.max(-1, Math.min(1, samples[index] * gain));
  }
  return output;
}

export function trimSilence(samples: Float32Array, threshold = 0.012, padding = 320) {
  let start = 0;
  let end = samples.length - 1;
  while (start < samples.length && Math.abs(samples[start]) < threshold) {
    start += 1;
  }
  while (end > start && Math.abs(samples[end]) < threshold) {
    end -= 1;
  }
  start = Math.max(0, start - padding);
  end = Math.min(samples.length - 1, end + padding);
  if (end <= start) {
    return samples.slice();
  }
  return samples.slice(start, end + 1);
}

export function resampleLinear(samples: Float32Array, fromSampleRate: number, toSampleRate: number) {
  if (fromSampleRate === toSampleRate || samples.length === 0) {
    return samples.slice();
  }
  const ratio = fromSampleRate / toSampleRate;
  const outputLength = Math.max(1, Math.round(samples.length / ratio));
  const output = new Float32Array(outputLength);
  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const left = Math.floor(sourceIndex);
    const right = Math.min(samples.length - 1, left + 1);
    const t = sourceIndex - left;
    output[index] = samples[left] * (1 - t) + samples[right] * t;
  }
  return output;
}

export function createToneWav(frequency: number, durationMs: number, sampleRate = 22050, volume = 0.18) {
  const sampleCount = Math.round((durationMs / 1000) * sampleRate);
  const samples = new Int16Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    const envelope = Math.sin(Math.PI * (index / Math.max(1, sampleCount - 1)));
    samples[index] = Math.round(Math.sin((2 * Math.PI * frequency * index) / sampleRate) * volume * envelope * 32767);
  }
  return encodeWav({ sampleRate, channels: 1, bitsPerSample: 16, samples });
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function readAscii(view: DataView, offset: number, length: number) {
  let text = '';
  for (let index = 0; index < length; index += 1) {
    text += String.fromCharCode(view.getUint8(offset + index));
  }
  return text;
}
