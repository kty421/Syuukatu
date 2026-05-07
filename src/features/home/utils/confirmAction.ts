import { Alert, Platform } from 'react-native';

type ConfirmActionParams = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

const getWebConfirm = () => {
  if (
    Platform.OS !== 'web' ||
    typeof globalThis.confirm !== 'function'
  ) {
    return null;
  }

  return globalThis.confirm.bind(globalThis);
};

export const confirmAction = ({
  title,
  message,
  confirmLabel,
  cancelLabel = 'キャンセル',
  destructive = false,
  onConfirm
}: ConfirmActionParams) => {
  const webConfirm = getWebConfirm();

  if (webConfirm) {
    const shouldConfirm = webConfirm(message ? `${title}\n\n${message}` : title);

    if (shouldConfirm) {
      void onConfirm();
    }

    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: () => {
        void onConfirm();
      }
    }
  ]);
};

export const confirmDestructiveAction = (
  params: Omit<ConfirmActionParams, 'destructive'>
) => confirmAction({ ...params, destructive: true });
