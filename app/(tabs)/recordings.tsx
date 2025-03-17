import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AudioService, { AudioFile } from '@/services/AudioService';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function RecordingsScreen() {
  const [recordings, setRecordings] = useState<AudioFile[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  
  const loadRecordings = async () => {
    const files = await AudioService.getRecordings();
    setRecordings(files);
    setError(null);
  };
  
  useFocusEffect(
    useCallback(() => {
      console.log('Loading recordings on focus');
      loadRecordings();
      return () => {
        // Stop any playback when leaving the screen
        AudioService.stopPlayback();
        setPlayingId(null);
        setIsPlaying(false);
      };
    }, [])
  );

  const handlePlayPause = async (item: AudioFile) => {
    if (playingId === item.id && isPlaying) {
      // Currently playing this item, so pause it
      await AudioService.stopPlayback();
      setIsPlaying(false);
    } else {
      // Play this item
      try {
        setError(null);
        const success = await AudioService.playRecording(item.uri, (status: any) => {
          if (!status.isLoaded) return;
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlayingId(null);
          }
        });
        
        if (success) {
          setPlayingId(item.id);
          setIsPlaying(true);
        }
      } catch (err) {
        setError(`Failed to play recording: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  const handleDeleteRecording = (item: AudioFile) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (playingId === item.id) {
              await AudioService.stopPlayback();
              setPlayingId(null);
              setIsPlaying(false);
            }
            const success = await AudioService.deleteRecording(item.uri);
            if (success) {
              loadRecordings();
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: AudioFile }) => {
    const isCurrentlyPlaying = isPlaying && playingId === item.id;
    
    return (
      <ThemedView 
        style={[
          styles.recordingItem, 
          playingId === item.id && { 
            borderColor: Colors[theme].tint,
            borderWidth: 1,
          }
        ]}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => handlePlayPause(item)}
        >
          <IconSymbol
            name={isCurrentlyPlaying ? 'pause.fill' : 'play.fill'}
            size={24}
            color={Colors[theme].tint}
          />
        </TouchableOpacity>
        
        <View style={styles.recordingInfo}>
          <ThemedText type="defaultSemiBold">
            {item.filename}
          </ThemedText>
          
          <ThemedText>
            Created on {formatDate(item.createdAt)}
          </ThemedText>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteRecording(item)}
        >
          <IconSymbol
            name="trash.fill"
            size={22}
            color={Colors[theme].icon}
          />
        </TouchableOpacity>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <ThemedText type="title">Recordings</ThemedText>
      </View>
      
      {/* Error message display */}
      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      )}
      
      {recordings.length > 0 ? (
        <FlatList
          data={recordings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>No recordings yet</ThemedText>
          <ThemedText>Your recordings will appear here</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 15,
  },
  listContent: {
    padding: 20,
    paddingTop: 5,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: 15,
  },
  deleteButton: {
    padding: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorContainer: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
  },
});
