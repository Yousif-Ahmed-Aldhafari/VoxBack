import { useCallback, useRef } from 'react';
import { Alert, BackHandler } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import type { RecordingPanelHandle } from '@/components/RecordingPanel';
import { useTranslation } from '@/hooks/useTranslation';

type RecordingPanelRef = {
  current: RecordingPanelHandle | null;
};

export function useRecordingBackHandler(recordingPanelRef: RecordingPanelRef, previousHref: Href) {
  const router = useRouter();
  const { t } = useTranslation();
  const isLeavingRef = useRef(false);
  const isDiscardPromptVisibleRef = useRef(false);

  const leaveScreen = useCallback(async () => {
    if (isLeavingRef.current) {
      return;
    }
    isLeavingRef.current = true;
    try {
      await recordingPanelRef.current?.prepareToLeave({ discardCompletedRecording: true });
    } finally {
      router.dismissTo(previousHref);
    }
  }, [previousHref, recordingPanelRef, router]);

  const handleBack = useCallback(() => {
    if (isLeavingRef.current || isDiscardPromptVisibleRef.current) {
      return;
    }

    if (!recordingPanelRef.current?.hasCompletedRecording()) {
      void leaveScreen();
      return;
    }

    isDiscardPromptVisibleRef.current = true;
    Alert.alert(
      t('discardRecordingTitle'),
      t('discardRecordingMessage'),
      [
        {
          text: t('keepRecording'),
          style: 'cancel',
          onPress: () => {
            isDiscardPromptVisibleRef.current = false;
          },
        },
        {
          text: t('discard'),
          style: 'destructive',
          onPress: () => {
            isDiscardPromptVisibleRef.current = false;
            void leaveScreen();
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          isDiscardPromptVisibleRef.current = false;
        },
      },
    );
  }, [leaveScreen, recordingPanelRef, t]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleBack]),
  );

  return handleBack;
}
