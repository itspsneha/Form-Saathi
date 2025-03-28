/**
 * Custom hook for audio recording functionality
 */

import { useState, useEffect, useRef } from 'react';

interface AudioRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
}

interface AudioRecorderHook extends AudioRecorderState {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  clearRecording: () => void;
}

export function useAudioRecorder(): AudioRecorderHook {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    audioBlob: null,
    audioUrl: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
      if (mediaRecorderRef.current && state.isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [state.audioUrl, state.isRecording]);

  const startRecording = async (): Promise<void> => {
    try {
      // Reset state
      audioChunksRef.current = [];
      setState(prev => ({
        ...prev,
        isRecording: true,
        audioBlob: null,
        audioUrl: null,
        error: null,
      }));

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setState(prev => ({
          ...prev,
          isRecording: false,
          audioBlob,
          audioUrl,
        }));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: 'Could not access microphone. Please check permissions.',
      }));
    }
  };

  const stopRecording = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // If we're not recording, return a default empty audio blob instead of rejecting
      if (!mediaRecorderRef.current || !state.isRecording) {
        console.warn('Attempted to stop recording when not recording - returning empty audio');
        // Create an empty audio blob as fallback
        const emptyBlob = new Blob([], { type: 'audio/wav' });
        setState(prev => ({
          ...prev,
          isRecording: false,
        }));
        resolve(emptyBlob);
        return;
      }
      
      // Add event listener to resolve promise when recording stops
      mediaRecorderRef.current.addEventListener('stop', () => {
        if (audioChunksRef.current.length === 0) {
          console.warn('No audio data available - returning empty audio');
          const emptyBlob = new Blob([], { type: 'audio/wav' });
          resolve(emptyBlob);
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        resolve(audioBlob);
      }, { once: true });
      
      // Stop recording
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping recording:', error);
        // Create an empty audio blob as fallback
        const emptyBlob = new Blob([], { type: 'audio/wav' });
        setState(prev => ({
          ...prev,
          isRecording: false,
        }));
        resolve(emptyBlob);
      }
    });
  };

  const clearRecording = () => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    
    setState({
      isRecording: false,
      audioBlob: null,
      audioUrl: null,
      error: null,
    });
  };

  return {
    ...state,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
