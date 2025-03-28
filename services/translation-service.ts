/**
 * Translation Service
 * Handles text translation between languages using Sarvam AI
 */

import { postJson } from './api-client';

/**
 * Translate text from one language to another
 * @param text The text to translate
 * @param sourceLanguageCode Source language code (or 'auto' for auto-detection)
 * @param targetLanguageCode Target language code
 * @returns Translated text
 */
export async function translateText(
  text: string,
  sourceLanguageCode: string = 'auto',
  targetLanguageCode: string
) {
  try {
    const response = await postJson('/translate', {
      input: text,
      source_language_code: sourceLanguageCode,
      target_language_code: targetLanguageCode,
      mode: 'formal',
      enable_preprocessing: true
    });
    
    return {
      translatedText: response.translated_text,
      detectedSourceLanguage: response.source_language_code
    };
  } catch (error) {
    console.error('Translation failed:', error);
    throw error;
  }
}

/**
 * Generate explanations for form fields in English
 * @param fieldLabels Array of form field labels
 * @returns Map of field labels to explanations
 */
export function generateFieldExplanations(fieldLabels: string[]) {
  // This is a simple implementation with predefined explanations
  // In a real implementation, this could use an LLM or more sophisticated logic
  
  const commonExplanations: Record<string, string> = {
    'Name': 'This is where you should write your full name as it appears on your official documents.',
    'Full Name': 'This is where you should write your complete name as it appears on your official documents.',
    'Address': 'This is where you should write your current residential address including house number, street, city, and PIN code.',
    'Mobile': 'This is where you should enter your 10-digit mobile phone number.',
    'Mobile Number': 'This is where you should enter your 10-digit mobile phone number.',
    'Phone': 'This is where you should enter your phone number with area code if applicable.',
    'Email': 'This is where you should enter your email address if you have one.',
    'Date of Birth': 'This is where you should enter your birth date in DD/MM/YYYY format.',
    'DOB': 'This is where you should enter your birth date in DD/MM/YYYY format.',
    'Age': 'This is where you should write your current age in years.',
    'Gender': 'This is where you should select your gender (Male/Female/Other).',
    'Occupation': 'This is where you should write your current job or profession.',
    'Income': 'This is where you should write your monthly or annual income amount.',
    'Aadhaar': 'This is where you should enter your 12-digit Aadhaar card number.',
    'Aadhaar Number': 'This is where you should enter your 12-digit Aadhaar card number.',
    'PAN': 'This is where you should enter your 10-character PAN (Permanent Account Number).',
    'PAN Number': 'This is where you should enter your 10-character PAN (Permanent Account Number).',
    'Signature': 'This is where you should sign the form with your signature.',
    'Photo': 'This is where you should attach or paste your recent passport-sized photograph.',
  };
  
  // Create a map of field labels to explanations
  const explanations: Record<string, string> = {};
  
  fieldLabels.forEach(label => {
    // Check for exact match
    if (commonExplanations[label]) {
      explanations[label] = commonExplanations[label];
      return;
    }
    
    // Check for partial match
    for (const [key, value] of Object.entries(commonExplanations)) {
      if (label.toLowerCase().includes(key.toLowerCase())) {
        explanations[label] = value;
        return;
      }
    }
    
    // Default explanation if no match found
    explanations[label] = `This field is for your ${label.toLowerCase()}. Please fill it accurately.`;
  });
  
  return explanations;
}

/**
 * Translate field explanations to the target language
 * @param explanations Map of field labels to explanations
 * @param targetLanguageCode Target language code
 * @returns Map of field labels to translated explanations
 */
export async function translateFieldExplanations(
  explanations: Record<string, string>,
  targetLanguageCode: string
) {
  const translatedExplanations: Record<string, string> = {};
  
  // Process explanations in batches to avoid too many API calls
  const batchSize = 5;
  const entries = Object.entries(explanations);
  
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    
    // Create a batch of promises for parallel processing
    const promises = batch.map(async ([label, explanation]) => {
      try {
        const { translatedText } = await translateText(
          explanation,
          'en-IN',
          targetLanguageCode
        );
        
        return { label, translatedExplanation: translatedText };
      } catch (error) {
        console.error(`Failed to translate explanation for ${label}:`, error);
        return { label, translatedExplanation: explanation }; // Fallback to original
      }
    });
    
    // Wait for all translations in this batch to complete
    const results = await Promise.all(promises);
    
    // Add translated explanations to the result map
    results.forEach(({ label, translatedExplanation }) => {
      translatedExplanations[label] = translatedExplanation;
    });
  }
  
  return translatedExplanations;
}
