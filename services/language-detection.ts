/**
 * Language Detection Service
 * Handles language identification from text and audio using Sarvam AI
 */

import { postJson, uploadFile } from './api-client';

/**
 * Supported languages with their BCP-47 codes
 */
export const SUPPORTED_LANGUAGES = {
  'ENGLISH': 'en-IN',
  'HINDI': 'hi-IN',
  'BENGALI': 'bn-IN',
  'GUJARATI': 'gu-IN',
  'KANNADA': 'kn-IN',
  'MALAYALAM': 'ml-IN',
  'MARATHI': 'mr-IN',
  'ODIA': 'od-IN',
  'PUNJABI': 'pa-IN',
  'TAMIL': 'ta-IN',
  'TELUGU': 'te-IN'
};

/**
 * Detect language from text input
 * @param text The text to detect language from
 * @returns Detected language code and script
 */
export async function detectLanguageFromText(text: string) {
  try {
    const response = await postJson('/text-lid', {
      input: text
    });
    
    return {
      languageCode: response.language_code,
      scriptCode: response.script_code
    };
  } catch (error) {
    console.error('Language detection failed:', error);
    throw error;
  }
}

/**
 * Detect language from audio input
 * @param audioBlob The audio blob to detect language from
 * @returns Detected language code
 */
export async function detectLanguageFromAudio(audioBlob: Blob) {
  try {
    // First convert audio to text using speech-to-text API
    const formData = new FormData();
    formData.append('file', audioBlob);
    formData.append('model', 'saarika:v2');
    formData.append('language_code', 'unknown'); // Let the API detect the language
    
    const response = await uploadFile('/speech-to-text', formData);
    
    // Return the detected language code
    return {
      transcript: response.transcript,
      languageCode: response.language_code
    };
  } catch (error) {
    console.error('Language detection from audio failed:', error);
    throw error;
  }
}

/**
 * Get display name for language code
 * @param languageCode BCP-47 language code
 * @returns Display name of the language
 */
export function getLanguageDisplayName(languageCode: string): string {
  const languageMap: Record<string, string> = {
    'en-IN': 'ENGLISH',
    'hi-IN': 'HINDI',
    'bn-IN': 'BENGALI',
    'gu-IN': 'GUJARATI',
    'kn-IN': 'KANNADA',
    'ml-IN': 'MALAYALAM',
    'mr-IN': 'MARATHI',
    'od-IN': 'ODIA',
    'pa-IN': 'PUNJABI',
    'ta-IN': 'TAMIL',
    'te-IN': 'TELUGU'
  };
  
  return languageMap[languageCode] || 'UNKNOWN';
}
