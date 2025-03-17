import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface Recording {
  id: string;
  uri: string;
  fileName: string;
  duration: number;
  createdAt: Date;
}

export function useAudioRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionResponse, setPermissionResponse] = useState<Audio.PermissionResponse | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    // Request permissions and load existing recordings when component mounts
    (async () => {
      const permission = await Audio.requestPermissionsAsync();
      setPermissionResponse(permission);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      loadRecordings();
    })();
  }, []);

  // Update recording duration while recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        setRecordingDuration(now - startTime);
      }, 100);
    } else {
      setRecordingDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, startTime]);

  const loadRecordings = async () => {
    try {
      const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
        setRecordings([]);
        return;
      }
      
      const files = await FileSystem.readDirectoryAsync(recordingsDir);
      const wavFiles = files.filter(file => file.endsWith('.wav'));
      
      const recordingFiles = await Promise.all(
        wavFiles.map(async (fileName) => {
          const fileInfo = await FileSystem.getInfoAsync(`${recordingsDir}${fileName}`);
          const parts = fileName.split('_');
          let id, timestamp, duration;
          
          try {
            id = parts[0];
            timestamp = Number(parts[1].replace('.wav', ''));
            duration = parts.length > 2 ? Number(parts[2]) : 0;
          } catch (e) {
            // If filename parsing fails, use fallbacks
            console.warn('Error parsing filename:', fileName);
            id = fileName;
            // Use creation time from file stats if available, otherwise current time
            // FileInfo doesn't have modificationTime, so we'll use current time as fallback
            timestamp = Date.now(); 
            duration = 0;
          }
          
          return {
            id,
            uri: fileInfo.uri,
            fileName,
            duration,
            createdAt: new Date(timestamp),
          };
        })
      );
      
      console.log(`Found ${recordingFiles.length} recordings`);
      setRecordings(recordingFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const startRecording = async () => {
    try {
      if (permissionResponse && !permissionResponse.granted) {
        console.log('No recording permission');
        return;
      }
      
      // Configure audio session for recording - simplified without interruption modes
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      console.log('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
            extension: '.wav',
            outputFormat: Audio.AndroidOutputFormat.DEFAULT,
            audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          },
          ios: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.web,
            mimeType: 'audio/wav',
          }
        }
      );
      
      setStartTime(Date.now());
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      const duration = recordingDuration;
      setStartTime(null);
      
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      if (!uri) {
        console.error('No recording URI available');
        return;
      }
      
      console.log(`Recording stopped, URI: ${uri}`);
      
      // Check if the file exists and has data
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        console.error('Recording file is missing or empty:', uri);
        return;
      }
      console.log(`Recording file size: ${fileInfo.size} bytes`);
      
      const id = Date.now().toString();
      const timestamp = Date.now();
      const fileName = `${id}_${timestamp}_${Math.round(duration)}.wav`;
      const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
      
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
      }
      
      // Copy the file to our app's documents directory with a .wav extension
      const destinationUri = `${recordingsDir}${fileName}`;
      console.log(`Copying recording to: ${destinationUri}`);
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      
      // Verify the copied file exists
      const destFileInfo = await FileSystem.getInfoAsync(destinationUri);
      if (destFileInfo.exists) {
        console.log(`File saved successfully, size: ${destFileInfo.size} bytes`);
      }
      
      // After saving, reload all recordings
      await loadRecordings();
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const deleteRecording = async (id: string) => {
    try {
      const recordingToDelete = recordings.find(r => r.id === id);
      if (recordingToDelete) {
        await FileSystem.deleteAsync(recordingToDelete.uri);
        setRecordings(recordings.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    recordings,
    loadRecordings,
    deleteRecording,
    recordingDuration,
  };
}
