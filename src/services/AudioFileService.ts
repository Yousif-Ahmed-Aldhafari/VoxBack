import * as FileSystem from 'expo-file-system/legacy';
import { fromByteArray, toByteArray } from 'base64-js';

export const tempAudioDirectory = `${FileSystem.cacheDirectory ?? ''}voxback-audio/`;

export async function ensureTempAudioDirectory() {
  const info = await FileSystem.getInfoAsync(tempAudioDirectory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(tempAudioDirectory, { intermediates: true });
  }
}

export async function writeBytesToCache(bytes: Uint8Array, prefix: string, extension = 'wav') {
  await ensureTempAudioDirectory();
  const uri = `${tempAudioDirectory}${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`;
  await FileSystem.writeAsStringAsync(uri, fromByteArray(bytes), { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}

export async function readBytes(uri: string) {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return toByteArray(base64);
}

export async function deleteIfExists(uri?: string) {
  if (!uri) {
    return;
  }
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

export async function deleteMany(uris: (string | undefined)[]) {
  await Promise.all(uris.filter(Boolean).map((uri) => deleteIfExists(uri)));
}
