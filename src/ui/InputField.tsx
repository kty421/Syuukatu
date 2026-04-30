import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode
} from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View
} from 'react-native';

import { AppTheme } from '../constants/theme';

type InputFieldProps = TextInputProps & {
  label: string;
  theme: AppTheme;
  required?: boolean;
  errorMessage?: string | null;
  trailing?: ReactNode;
  accentColor?: string;
  fieldKey?: string;
  onContainerLayout?: (fieldKey: string, y: number) => void;
};

export const InputField = forwardRef<TextInput, InputFieldProps>(
  (
    {
      label,
      theme,
      required,
      errorMessage,
      trailing,
      accentColor,
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

    useImperativeHandle(ref, () => inputRef.current as TextInput);

    const handleLayout = (event: LayoutChangeEvent) => {
      if (!fieldKey || !onContainerLayout) {
        return;
      }

      onContainerLayout(fieldKey, event.nativeEvent.layout.y);
    };

    return (
      <View onLayout={handleLayout}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>
          {label}
          {required ? (
            <Text style={{ color: theme.colors.danger }}> *</Text>
          ) : null}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={(event) => {
            event.stopPropagation();
            inputRef.current?.focus();
          }}
          style={[
            styles.fieldShell,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: errorMessage ? theme.colors.danger : theme.colors.outline
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
              onBlur?.(event);
            }}
            onFocus={(event) => {
              onFocus?.(event);
            }}
            multiline={multiline}
            style={[
              styles.input,
              multiline && styles.textArea,
              { color: theme.colors.text },
              style
            ]}
            {...props}
          />
          {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
        </Pressable>
        {errorMessage ? (
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
            {errorMessage}
          </Text>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 8
  },
  fieldShell: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 52,
    paddingLeft: 16,
    paddingRight: 12
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    minHeight: 52,
    paddingVertical: 14
  },
  textArea: {
    minHeight: 112,
    paddingTop: 14,
    textAlignVertical: 'top'
  },
  trailing: {
    marginLeft: 8
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    marginTop: 7
  }
});
