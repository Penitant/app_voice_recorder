import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface RecordingTimerProps {
  isRecording: boolean;
}

export function RecordingTimer({ isRecording }: RecordingTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <ThemedText style={styles.timer} type="title">
      {formatTime(seconds)}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 48,
    marginVertical: 24,
  },
});
