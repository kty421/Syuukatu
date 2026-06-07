import {
  forwardRef,
  useState,
  useImperativeHandle,
  useRef,
  type ReactNode
} from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  TextInput,
  TextInputProps,
  View,
  ViewStyle
} from 'react-native';

import { AppTheme } from '../constants/theme';

const webInputOutlineReset =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle)
    : null;

const webShellOutlineReset =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none', outlineWidth: 0 } as unknown as ViewStyle)
    : null;

const getWebShellCursor = (disabled?: boolean) =>
  Platform.OS === 'web'
    ? ({ cursor: disabled ? 'not-allowed' : 'text' } as unknown as ViewStyle)
    : null;

type InputFieldProps = TextInputProps & {
  label: string;
  theme: AppTheme;
  required?: boolean;
  hideLabel?: boolean;
  errorMessage?: string | null;
  helperText?: string | null;
  trailing?: ReactNode;
  fieldKey?: string;
  onContainerLayout?: (fieldKey: string, y: number) => void;
};

export const InputField = forwardRef<TextInput, InputFieldProps>(
  (
    {
      label,
      theme,
      required,
      hideLabel,
      errorMessage,
      helperText,
      trailing,
      fieldKey,
      onContainerLayout,
      style,
      onFocus,
      onBlur,
      placeholder,
      multiline,
      value,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null);
    const hasValue = typeof value === 'string' && value.length > 0;
    const disabled = props.editable === false;
    const [focused, setFocused] = useState(false);

    useImperativeHandle(ref, () => inputRef.current as TextInput);

    const handleLayout = (event: LayoutChangeEvent) => {
      if (!fieldKey || !onContainerLayout) {
        return;
      }

      onContainerLayout(fieldKey, event.nativeEvent.layout.y);
    };

    return (
      <View onLayout={handleLayout}>
        {hideLabel ? null : (
          <Text
            numberOfLines={2}
            style={[
              theme.typography.footnote,
              styles.label,
              { color: theme.colors.textSecondary }
            ]}
          >
            {label}
            {required ? (
              <Text style={{ color: theme.colors.danger }}> *</Text>
            ) : null}
          </Text>
        )}
        <Pressable
          accessibilityLabel={label}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          onPress={(event) => {
            event.stopPropagation();
            if (!disabled) {
              inputRef.current?.focus();
            }
          }}
          style={({ pressed }) => [
            styles.fieldShell,
            multiline && styles.fieldShellMultiline,
            webShellOutlineReset,
            getWebShellCursor(disabled),
            {
              backgroundColor:
                pressed && !focused && !disabled
                  ? theme.colors.surfaceSubtle
                  : theme.colors.surfaceElevated,
              borderColor: errorMessage
                ? theme.colors.danger
                : focused
                  ? theme.colors.focusRing
                  : theme.colors.border,
              borderRadius: theme.radii.md,
              minHeight: multiline ? 112 : theme.component.controlHeight,
              opacity: disabled ? theme.state.disabledOpacity : 1,
              paddingLeft: theme.spacing.md,
              paddingRight: theme.spacing.sm
            }
          ]}
        >
          <TextInput
            ref={inputRef}
            autoCorrect={false}
            value={value}
            placeholder={hasValue ? '' : placeholder}
            placeholderTextColor={theme.colors.placeholder}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            multiline={multiline}
            style={[
              styles.input,
              multiline && styles.textArea,
              webInputOutlineReset,
              theme.typography.body,
              {
                color: theme.colors.textPrimary,
                minHeight: multiline ? 112 : theme.component.controlHeight
              },
              style
            ]}
            {...props}
          />
          {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
        </Pressable>
        {errorMessage || helperText ? (
          <Text
            style={[
              theme.typography.caption,
              styles.helpText,
              {
                color: errorMessage
                  ? theme.colors.danger
                  : theme.colors.textMuted
              }
            ]}
          >
            {errorMessage ?? helperText}
          </Text>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  label: {
    marginBottom: 8
  },
  fieldShell: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    overflow: 'hidden'
  },
  fieldShellMultiline: {
    alignItems: 'flex-start'
  },
  input: {
    flex: 1,
    paddingVertical: 14
  },
  textArea: {
    paddingTop: 14,
    textAlignVertical: 'top'
  },
  trailing: {
    marginLeft: 8
  },
  helpText: {
    marginTop: 7
  }
});
