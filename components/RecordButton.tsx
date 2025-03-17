import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
}

export function RecordButton({ isRecording, onPress }: RecordButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isRecording ? styles.recording : styles.notRecording]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={isRecording ? styles.stopIcon : styles.recordIcon} />
      </TouchableOpacity>
      <ThemedText style={styles.label}>
        {isRecording ? 'Stop' : 'Record'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notRecording: {
    backgroundColor: '#E74C3C',
  },
  recording: {
    backgroundColor: '#3498DB',
  },
  recordIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  stopIcon: {
    width: 20,
    height: 20,
    backgroundColor: 'white',
  },
  label: {
    marginTop: 8,
    fontSize: 16,
  },
});
