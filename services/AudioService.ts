import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface AudioFile {
  id: string;
  uri: string;
  filename: string;
  duration: number;
  createdAt: Date;
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private recordingsDirectory = `${FileSystem.documentDirectory}recordings/`;
  
  // Initialize the recordings directory
  async init() {
    const dirInfo = await FileSystem.getInfoAsync(this.recordingsDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.recordingsDirectory, { intermediates: true });
    }
  }

  // Request microphone permission
  async requestPermission() {
    const permission = await Audio.requestPermissionsAsync();
    return permission.granted;
  }

  // Start recording
  async startRecording() {
    try {
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        throw new Error("Microphone permission not granted");
      }

      // Simplified audio mode configuration without interruption modes
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      await this.init();
      
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      });
      
      this.recording = recording;
      return true;
    } catch (error) {
      console.error("Failed to start recording:", error);
      return false;
    }
  }

  // Stop recording
  async stopRecording(): Promise<AudioFile | null> {
    try {
      if (!this.recording) {
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();
      this.recording = null;
      
      if (!uri) {
        return null;
      }

      // Check if file exists and has data
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        console.error('Recording file is missing or empty:', uri);
        return null;
      }
      
      // Create a WAV file with timestamp
      const timestamp = Date.now();
      const id = timestamp.toString();
      const filename = `recording_${timestamp}.wav`;
      const destinationUri = `${this.recordingsDirectory}${filename}`;

      // Copy the recorded file to our app's documents directory
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      
      // Verify the copied file exists
      const destFileInfo = await FileSystem.getInfoAsync(destinationUri);
      if (!destFileInfo.exists) {
        console.error('Failed to save recording:', destinationUri);
        return null;
      }

      console.log(`Recording saved: ${filename}, size: ${destFileInfo.size} bytes`);

      return {
        id,
        uri: destinationUri,
        filename,
        duration: status.durationMillis || 0,
        createdAt: new Date()
      };
    } catch (error) {
      console.error("Failed to stop recording:", error);
      return null;
    }
  }

  // Get all recordings
  async getRecordings(): Promise<AudioFile[]> {
    try {
      await this.init();
      
      const files = await FileSystem.readDirectoryAsync(this.recordingsDirectory);
      const wavFiles = files.filter(file => file.endsWith('.wav'));
      
      if (wavFiles.length === 0) {
        return [];
      }
      
      const recordings = await Promise.all(wavFiles.map(async filename => {
        const fileUri = `${this.recordingsDirectory}${filename}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        const id = filename.split('_')[1]?.split('.')[0] || Date.now().toString();
        const timestamp = parseInt(id);
        
        return {
          id,
          uri: fileUri,
          filename,
          duration: 0, // Duration will be determined during playback
          createdAt: new Date(timestamp)
        };
      }));
      
      return recordings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error("Failed to get recordings:", error);
      return [];
    }
  }

  // Play a recording
  async playRecording(uri: string, onPlaybackStatusUpdate: (status: any) => void) {
    try {
      // Stop any existing playback
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.error('Audio file not found:', uri);
        return false;
      }

      // Simplified audio mode configuration
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );

      this.sound = sound;
      await sound.playAsync();
      return true;
    } catch (error) {
      console.error("Failed to play recording:", error);
      return false;
    }
  }

  // Stop playback
  async stopPlayback() {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      } catch (error) {
        console.error("Error stopping playback:", error);
      }
    }
  }

  // Delete a recording
  async deleteRecording(uri: string): Promise<boolean> {
    try {
      // If the file is currently playing, stop it first
      if (this.sound) {
        await this.stopPlayback();
      }

      // Verify file exists before attempting to delete
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.warn('File does not exist, nothing to delete:', uri);
        return false;
      }

      await FileSystem.deleteAsync(uri);
      return true;
    } catch (error) {
      console.error("Failed to delete recording:", error);
      return false;
    }
  }
}

export default new AudioService();
