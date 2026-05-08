import { useCallback, useState } from 'react';

export type ConfirmActionParams = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

export type ConfirmActionRequest = ConfirmActionParams & {
  destructive: boolean;
};

export const useConfirmAction = () => {
  const [request, setRequest] = useState<ConfirmActionRequest | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const confirmAction = useCallback((params: ConfirmActionParams) => {
    setRequest({
      ...params,
      destructive: params.destructive ?? false
    });
  }, []);

  const confirmDestructiveAction = useCallback(
    (params: Omit<ConfirmActionParams, 'destructive'>) => {
      confirmAction({
        ...params,
        destructive: true
      });
    },
    [confirmAction]
  );

  const cancelConfirmAction = useCallback(() => {
    if (!isRunning) {
      setRequest(null);
    }
  }, [isRunning]);

  const runConfirmAction = useCallback(async () => {
    if (!request || isRunning) {
      return;
    }

    setIsRunning(true);

    try {
      await request.onConfirm();
    } finally {
      setIsRunning(false);
      setRequest(null);
    }
  }, [isRunning, request]);

  return {
    request,
    isRunning,
    confirmAction,
    confirmDestructiveAction,
    cancelConfirmAction,
    runConfirmAction
  };
};
