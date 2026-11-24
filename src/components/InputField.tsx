import React, { useState, useRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export interface InputHandle {
  focus: () => void;
  blur: () => void;
}

export interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  editable?: boolean;
  rightAction?: React.ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  required?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  dark?: boolean;
}

export const InputField = React.forwardRef<InputHandle, InputFieldProps>(
  function InputField(
    {
      label,
      value,
      onChangeText,
      placeholder,
      secureTextEntry,
      keyboardType = 'default',
      returnKeyType,
      onSubmitEditing,
      blurOnSubmit,
      icon,
      error,
      editable = true,
      rightAction,
      multiline = false,
      numberOfLines = 1,
      style,
      required = false,
      autoCapitalize = 'none',
      dark = false,
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(!secureTextEntry);
    const internalInputRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        internalInputRef.current?.focus();
      },
      blur: () => {
        internalInputRef.current?.blur();
      },
    }));

    const handleFocusInput = () => {
      if (editable) {
        internalInputRef.current?.focus();
      }
    };

    return (
      <View style={[styles.container, style]}>
        {label && (
          <Pressable onPress={handleFocusInput} style={styles.labelRow}>
            <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>
            {required && <Text style={styles.required}> *</Text>}
          </Pressable>
        )}

        <Pressable
          onPress={handleFocusInput}
          style={[
            styles.inputContainer,
            dark && styles.inputContainerDark,
            isFocused && (dark ? styles.inputFocusedDark : styles.inputFocused),
            error ? styles.inputError : null,
            !editable && (dark ? styles.inputDisabledDark : styles.inputDisabled),
            multiline && styles.inputMultiline,
          ]}
        >
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={
                isFocused
                  ? colors.primaryVibrant
                  : dark
                  ? '#94A3B8'
                  : colors.textMuted
              }
              style={styles.leftIcon}
            />
          )}

          <TextInput
            ref={internalInputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={dark ? '#94A3B8' : colors.textMuted}
            secureTextEntry={secureTextEntry && !showPassword}
            keyboardType={keyboardType}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={blurOnSubmit}
            editable={editable}
            multiline={multiline}
            numberOfLines={numberOfLines}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize={autoCapitalize}
            style={[
              styles.input,
              dark && styles.inputDark,
              multiline && styles.textMultiline,
            ]}
          />

          {secureTextEntry ? (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.rightAction}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={dark ? '#94A3B8' : colors.textMuted}
              />
            </TouchableOpacity>
          ) : (
            rightAction && <View style={styles.rightAction}>{rightAction}</View>
          )}
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelDark: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  required: {
    color: colors.statRedIcon,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputFocusedDark: {
    borderColor: colors.primaryVibrant,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  inputError: {
    borderColor: colors.statRedIcon,
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.border,
  },
  inputDisabledDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputMultiline: {
    minHeight: 90,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 12,
    minHeight: 46,
  },
  inputDark: {
    color: '#FFFFFF',
  },
  textMultiline: {
    textAlignVertical: 'top',
  },
  leftIcon: {
    marginRight: 10,
  },
  rightAction: {
    marginLeft: 8,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.statRedIcon,
    marginTop: 4,
    marginLeft: 2,
  },
});
