import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureResponderEvent } from 'react-native';

import { AppTheme } from '../constants/theme';
import { IconButton } from './IconButton';

const COPIED_FEEDBACK_DURATION_MS = 1500;

type CopyFeedbackButtonProps = {
  label: string;
  resetKey: string;
  theme: AppTheme;
  disabled?: boolean;
  onCopy: () => Promise<boolean>;
};

export const CopyFeedbackButton = ({
  label,
  resetKey,
  theme,
  disabled,
  onCopy
}: CopyFeedbackButtonProps) => {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const operationIdRef = useRef(0);
  const copyingRef = useRef(false);
  const mountedRef = useRef(false);

  const clearCopiedTimeout = useCallback(() => {
    if (!copiedTimeoutRef.current) {
      return;
    }

    clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      operationIdRef.current += 1;
      clearCopiedTimeout();
    };
  }, [clearCopiedTimeout]);

  useEffect(() => {
    operationIdRef.current += 1;
    copyingRef.current = false;
    clearCopiedTimeout();
    setCopied(false);
  }, [clearCopiedTimeout, resetKey]);

  const handleCopy = useCallback(
    async (event: GestureResponderEvent) => {
      event.stopPropagation();

      if (disabled || copyingRef.current) {
        return;
      }

      clearCopiedTimeout();
      setCopied(false);
      copyingRef.current = true;
      const operationId = operationIdRef.current + 1;
      operationIdRef.current = operationId;

      let succeeded: boolean;

      try {
        succeeded = await onCopy();
      } catch {
        return;
      } finally {
        if (operationIdRef.current === operationId) {
          copyingRef.current = false;
        }
      }

      if (
        !succeeded ||
        !mountedRef.current ||
        operationIdRef.current !== operationId
      ) {
        return;
      }

      setCopied(true);
      copiedTimeoutRef.current = setTimeout(() => {
        copiedTimeoutRef.current = null;

        if (mountedRef.current && operationIdRef.current === operationId) {
          setCopied(false);
        }
      }, COPIED_FEEDBACK_DURATION_MS);
    },
    [clearCopiedTimeout, disabled, onCopy]
  );

  return (
    <IconButton
      icon={copied ? 'checkmark' : 'copy-outline'}
      label={copied ? `${label}（コピー済み）` : label}
      onPress={handleCopy}
      theme={theme}
      tone="neutral"
      variant="plain"
      size="compact"
      iconSize={17}
      disabled={disabled}
    />
  );
};
