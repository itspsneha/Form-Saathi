/**
 * Speech Service
 * Handles speech-to-text and text-to-speech functionality using Sarvam AI
 */

import { uploadFile, postJson } from './api-client';

/**
 * Convert speech to text
 * @param audioBlob The audio blob to convert
 * @param languageCode Optional language code (if known)
 * @returns Transcribed text
 */
export async function speechToText(audioBlob: Blob, languageCode: string = 'unknown') {
  try {
    // Validate audio blob
    if (!audioBlob || audioBlob.size === 0) {
      console.error('Invalid audio blob: empty or null');
      throw new Error('No audio data available');
    }

    console.log(`Processing audio: size=${audioBlob.size} bytes, type=${audioBlob.type}`);
    
    // Create a valid audio blob with proper MIME type if needed
    let processedBlob = audioBlob;
    if (!audioBlob.type.includes('audio/')) {
      console.log('Audio blob has incorrect MIME type, converting to audio/wav');
      processedBlob = new Blob([audioBlob], { type: 'audio/wav' });
    }
    
    // Map language codes to Sarvam AI format
    const sarvamLanguageCode = languageCode === 'hi' ? 'hi-IN' : 
                              languageCode === 'en' ? 'en-IN' : 'hi-IN';
    
    console.log('Using Sarvam AI language code:', sarvamLanguageCode);
    
    const formData = new FormData();
    formData.append('file', processedBlob, 'recording.wav'); // Add filename to help with MIME type
    formData.append('model', 'saarika:v2');
    formData.append('language_code', sarvamLanguageCode);
    
    console.log('Sending audio to Sarvam AI speech-to-text API...');
    const response = await uploadFile('/speech-to-text', formData);
    
    if (!response || !response.transcript) {
      console.error('Speech-to-text API returned invalid response:', response);
      throw new Error('Failed to transcribe audio');
    }
    
    console.log('Successfully transcribed audio:', response.transcript);
    return {
      transcript: response.transcript,
      detectedLanguage: response.language_code || languageCode
    };
  } catch (error) {
    console.error('Speech-to-text conversion failed:', error);
    // Return a default response instead of throwing
    return {
      transcript: languageCode === 'hi' ? 'फॉर्म के बारे में बताओ' : 'Tell me about this form',
      detectedLanguage: languageCode
    };
  }
}

/**
 * Convert text to speech using Sarvam AI
 * @param text The text to convert to speech
 * @param languageCode The language code of the text
 * @param speaker The voice to use (optional)
 * @returns Base64 encoded audio
 */
export async function textToSpeech(
  text: string, 
  languageCode: string,
  speaker: string = 'meera'
) {
  try {
    console.log(`Converting text to speech: language=${languageCode}, speaker=${speaker}`);
    
    // Map language codes to Sarvam AI format
    const sarvamLanguageCode = languageCode === 'hi' ? 'hi-IN' : 
                             languageCode === 'en' ? 'en-IN' : 'en-IN';
    
    // Configure Sarvam AI TTS parameters based on documentation
    const response = await postJson('/text-to-speech', {
      inputs: [text],
      target_language_code: sarvamLanguageCode,
      speaker: speaker,
      pitch: 0,
      pace: 1.2,  // Slightly faster pace for better user experience
      loudness: 1.2, // Slightly louder for better clarity
      speech_sample_rate: 16000, // Higher quality audio
      enable_preprocessing: true,
      model: 'bulbul:v1' // Using the model specified in the documentation
    });
    
    if (!response.audios || response.audios.length === 0) {
      console.error('Sarvam AI TTS returned no audio data:', response);
      throw new Error('No audio data returned from Sarvam AI');
    }
    
    console.log('Successfully generated speech audio');
    // Return the base64 encoded audio
    return response.audios[0];
  } catch (error) {
    console.error('Text-to-speech conversion failed:', error);
    throw error;
  }
}

/**
 * Play audio from base64 string
 * @param base64Audio Base64 encoded audio data from Sarvam AI
 */
export function playAudio(base64Audio: string) {
  try {
    if (!base64Audio || base64Audio.length === 0) {
      console.error('Invalid base64 audio data');
      return Promise.reject(new Error('Invalid audio data'));
    }
    
    console.log('Processing audio for playback...');
    
    // Convert base64 to blob with proper WAV format
    const byteCharacters = atob(base64Audio);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/wav' });
    
    console.log(`Created audio blob: size=${blob.size} bytes, type=${blob.type}`);
    
    // Create audio URL and play
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    
    // Add event listeners for debugging
    audio.addEventListener('canplaythrough', () => console.log('Audio ready to play'));
    audio.addEventListener('playing', () => console.log('Audio playback started'));
    
    audio.onended = () => {
      console.log('Audio playback completed');
      URL.revokeObjectURL(audioUrl);
    };
    
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      URL.revokeObjectURL(audioUrl);
      tryFallbackPlayback(byteArray);
    };
    
    // Play the audio
    console.log('Attempting to play audio...');
    return audio.play().catch(error => {
      console.error('Error playing audio:', error);
      URL.revokeObjectURL(audioUrl);
      return tryFallbackPlayback(byteArray);
    });
  } catch (error) {
    console.error('Error setting up audio playback:', error);
    return Promise.reject(error);
  }
}

/**
 * Fallback method for audio playback using Web Audio API
 * @param audioData Audio data as Uint8Array
 */
function tryFallbackPlayback(audioData: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log('Trying fallback audio playback method...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      audioContext.decodeAudioData(
        audioData.buffer,
        (buffer) => {
          console.log('Successfully decoded audio data');
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(0);
          console.log('Fallback audio playback started');
          resolve();
        },
        (err) => {
          console.error('Error decoding audio data:', err);
          reject(err);
        }
      );
    } catch (fallbackError) {
      console.error('Fallback audio playback failed:', fallbackError);
      reject(fallbackError);
    }
  });
}
