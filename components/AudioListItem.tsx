import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface AudioListItemProps {
  filename: string;
  duration: string;
  date: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDelete: () => void;
}

export function AudioListItem({ 
  filename, 
  duration, 
  date, 
  isPlaying, 
  onPlayPause, 
  onDelete 
}: AudioListItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.playButton}
        onPress={onPlayPause}
      >
        <View style={[
          styles.playIcon, 
          isPlaying ? styles.pauseIcon : styles.playTriangle,
          { backgroundColor: Colors[colorScheme].tint }
        ]} />
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {filename}
        </ThemedText>
        <ThemedText>
          {duration} • {date}
        </ThemedText>
      </View>
      
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <ThemedText style={{ color: '#E74C3C' }}>Delete</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 16,
    height: 16,
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 16,
    borderRightWidth: 0,
    borderBottomWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'white',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  pauseIcon: {
    width: 16,
    height: 16,
    backgroundColor: 'white',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
