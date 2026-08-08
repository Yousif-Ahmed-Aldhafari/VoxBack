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

  const play = useCallback(() => {
    if (!uri) {
      return;
    }
    player.play();
  }, [player, uri]);

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
    progress: status.duration > 0 ? status.currentTime / status.duration : 0,
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
      if (player.currentStatus.didJustFinish || player.currentStatus.error) {
        clearInterval(poll);
        player.pause();
        resolve();
      }
    }, 120);
    player.play();
  });
}
