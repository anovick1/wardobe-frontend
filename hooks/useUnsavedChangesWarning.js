import { useCallback } from 'react';
import { Alert } from 'react-native';

export const useUnsavedChangesWarning = (hasUnsavedChanges = false) => {
  const showExitWarning = useCallback((onConfirmExit) => {
    if (!hasUnsavedChanges) {
      onConfirmExit();
      return;
    }

    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
      [
        {
          text: 'Stay',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: onConfirmExit,
        },
      ]
    );
  }, [hasUnsavedChanges]);

  return { showExitWarning };
};