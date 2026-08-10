import { useCallback, useEffect } from 'react';
import { createAudioPlayer, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export function useAudioPlaybackService(uri?: string) {
  const player = useAudioPlayer(uri ? { uri } : null, { updateInterval: 80 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (uri) {
      player.replace({ uri });
    }
  }, [player, uri]);

  const play = useCallback(async () => {
    if (!uri) {
      return;
    }
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.05)) {
      await player.seekTo(0);
    }
    player.play();
  }, [player, status.currentTime, status.didJustFinish, status.duration, uri]);

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const restart = useCallback(async () => {
    if (!uri) {
      return;
    }
    await player.seekTo(0);
    player.play();
  }, [player, uri]);

  const seekBy = useCallback(
    async (seconds: number) => {
      const nextTime = Math.max(0, Math.min(status.duration || 0, status.currentTime + seconds));
      await player.seekTo(nextTime);
    },
    [player, status.currentTime, status.duration],
  );

  return {
    status,
    play,
    pause,
    restart,
    seekBy,
    isPlaying: status.playing,
    isFinished: status.didJustFinish,
    progress: status.duration > 0 ? Math.max(0, Math.min(1, status.currentTime / status.duration)) : 0,
  };
}

export async function playAudioSequence(uris: string[]) {
  for (const uri of uris) {
    await playOne(uri);
  }
}

function playOne(uri: string) {
  return new Promise<void>((resolve) => {
    const player = createAudioPlayer({ uri }, { updateInterval: 80 });
    const poll = setInterval(() => {
      if (player.currentStatus.didJustFinish) {
        clearInterval(poll);
        player.pause();
        resolve();
      }
    }, 120);
    player.play();
  });
}
