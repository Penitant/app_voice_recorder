import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { RecordingTimer } from '@/components/RecordingTimer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AudioService from '@/services/AudioService';

export default function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  useEffect(() => {
    // Check for recording permissions when component mounts
    AudioService.requestPermission().then(granted => {
      setPermissionGranted(granted);
    });
  }, []);
  
  const handleRecordPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      const recording = await AudioService.stopRecording();
      if (recording) {
        console.log('Recording saved:', recording.filename);
      }
    } else {
      const started = await AudioService.startRecording();
      setIsRecording(started);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}>
        <ThemedText type="title" style={styles.heading}>
          Voice Recorder
        </ThemedText>
        
        {!permissionGranted ? (
          <View style={styles.messageContainer}>
            <ThemedText style={styles.instructions}>
              Microphone permission is required to record audio
            </ThemedText>
          </View>
        ) : (
          <>
            <RecordingTimer isRecording={isRecording} />
            
            <ThemedText style={styles.instructions}>
              {isRecording
                ? 'Recording in progress...'
                : 'Tap the button below to start recording'}
            </ThemedText>
          </>
        )}
      </View>

      <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.stopButton : styles.startButton,
          ]}
          onPress={handleRecordPress}
          activeOpacity={0.8}
          disabled={!permissionGranted}
        >
          <IconSymbol
            name={isRecording ? 'stop.fill' : 'mic.fill'}
            color="white"
            size={40}
          />
        </TouchableOpacity>

        <ThemedText style={styles.buttonText}>
          {isRecording ? 'Stop' : 'Record'}
        </ThemedText>
      </View>

      {!isRecording && (
        <TouchableOpacity
          style={styles.viewRecordingsButton}
          onPress={() => router.push('/(tabs)/recordings')}
        >
          <ThemedText style={styles.viewRecordingsText}>View Recordings</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  heading: {
    marginBottom: 20,
  },
  instructions: {
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 100 : 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButton: {
    backgroundColor: '#E74C3C',
  },
  stopButton: {
    backgroundColor: '#3498DB',
  },
  buttonText: {
    marginTop: 5,
    fontSize: 16,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewRecordingsButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 15,
    alignSelf: 'center',
    padding: 10,
  },
  viewRecordingsText: {
    color: '#0a7ea4',
    fontSize: 16,
    fontWeight: '600',
  },
});
