import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Recording } from '@/hooks/useAudioRecorder';
import * as FileSystem from 'expo-file-system';

// Define a type for the playback status to avoid using 'any'
type PlaybackStatus = {
  isLoaded: boolean;
  error?: string;
  isPlaying?: boolean;
  positionMillis?: number;
  durationMillis?: number;
  didJustFinish?: boolean;
};

export function useAudioPlayer() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Set up audio mode for playback
  const configureAudioSession = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (err) {
      console.error('Failed to configure audio mode:', err);
    }
  };

  const playSound = async (recording: Recording) => {
    setError(null);
    
    // First check if the file exists and has content
    try {
      const fileInfo = await FileSystem.getInfoAsync(recording.uri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        setError(`File doesn't exist or is empty: ${recording.uri}`);
        return;
      }
      
      console.log(`Playing file: ${recording.uri}, Size: ${fileInfo.size} bytes`);
    } catch (err) {
      console.error('Error checking file:', err);
    }
    
    // Configure audio for playback
    await configureAudioSession();
    
    // Stop any currently playing sound
    if (sound) {
      await sound.unloadAsync();
    }

    try {
      console.log('Creating sound object...');
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 }, // Set shouldPlay to true
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setPlayingId(recording.id);
      
      // Remove the loadAsync() call - the sound is already loaded by createAsync
      // And set shouldPlay: true above instead of manually calling playAsync
      
      console.log('Playback started');
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing sound:', error);
      setError(`Playback error: ${error instanceof Error ? error.message : String(error)}`);
      setIsPlaying(false);
      setPlayingId(null);
    }
  };

  const onPlaybackStatusUpdate = (status: PlaybackStatus) => {
    // Log detailed status for debugging
    console.log('Playback status:', JSON.stringify(status));
    
    if (!status.isLoaded) {
      // Handle unloaded status
      if (status.error) {
        console.error(`Playback error: ${status.error}`);
        setError(`Playback error: ${status.error}`);
      }
      return;
    }
    
    // Now we know status is loaded
    setIsPlaying(status.isPlaying || false);
    setPosition(status.positionMillis || 0);
    setDuration(status.durationMillis || 0);
    
    // When playback finishes
    if (status.didJustFinish) {
      console.log('Playback finished');
      setIsPlaying(false);
      setPlayingId(null);
      setPosition(0);
    }
  };

  const pauseSound = async () => {
    if (sound) {
      try {
        await sound.pauseAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error pausing sound:', error);
      }
    }
  };

  const resumeSound = async () => {
    if (sound) {
      try {
        await sound.playAsync();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error resuming sound:', error);
        setError(`Resume error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  const stopSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        setIsPlaying(false);
        setPlayingId(null);
        setPosition(0);
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    playSound,
    pauseSound,
    resumeSound,
    stopSound,
    isPlaying,
    playingId,
    position,
    duration,
    formatTime,
    error,
  };
}
