export function isRecordingDurationValid(durationMs: number, minDurationMs = 500, maxDurationSeconds?: number) {
  if (durationMs < minDurationMs) {
    return false;
  }
  if (maxDurationSeconds !== undefined && durationMs > maxDurationSeconds * 1000 + 120) {
    return false;
  }
  return true;
}
