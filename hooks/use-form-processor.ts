/**
 * Custom hook for form processing logic
 */

import { useState } from 'react';
import { parseForm } from '@/services/form-parser';
import { translateFieldExplanations, generateFieldExplanations } from '@/services/translation-service';
import { textToSpeech } from '@/services/speech-service';
import { SUPPORTED_LANGUAGES } from '@/services/language-detection';

interface FormField {
  label: string;
  explanation: string;
  audioBase64?: string;
}

interface FormProcessorState {
  isProcessing: boolean;
  formFields: FormField[];
  error: string | null;
}

interface FormProcessorHook extends FormProcessorState {
  processForm: (file: File) => Promise<void>;
  translateExplanations: (languageCode: string) => Promise<void>;
  generateAudio: (languageCode: string) => Promise<void>;
  resetProcessor: () => void;
}

export function useFormProcessor(): FormProcessorHook {
  const [state, setState] = useState<FormProcessorState>({
    isProcessing: false,
    formFields: [],
    error: null,
  });

  const processForm = async (file: File): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      // Parse the form
      const fields = await parseForm(file);
      
      // Generate explanations in English
      const fieldLabels = fields.map(field => field.label);
      const explanations = generateFieldExplanations(fieldLabels);
      
      // Create form fields with explanations
      const formFields = fields.map(field => ({
        label: field.label,
        explanation: explanations[field.label] || `This is the ${field.label} field.`,
      }));
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        formFields,
      }));
    } catch (error) {
      console.error('Form processing failed:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to process form. Please try again.',
      }));
    }
  };

  const translateExplanations = async (languageCode: string): Promise<void> => {
    try {
      if (state.formFields.length === 0) {
        throw new Error('No form fields to translate');
      }
      
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      // Get English explanations
      const explanations: Record<string, string> = {};
      state.formFields.forEach(field => {
        explanations[field.label] = field.explanation;
      });
      
      // Skip translation if target language is English
      if (languageCode === SUPPORTED_LANGUAGES.ENGLISH) {
        setState(prev => ({ ...prev, isProcessing: false }));
        return;
      }
      
      // Translate explanations
      const translatedExplanations = await translateFieldExplanations(
        explanations,
        languageCode
      );
      
      // Update form fields with translated explanations
      const updatedFields = state.formFields.map(field => ({
        ...field,
        explanation: translatedExplanations[field.label] || field.explanation,
      }));
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        formFields: updatedFields,
      }));
    } catch (error) {
      console.error('Translation failed:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to translate explanations. Please try again.',
      }));
    }
  };

  const generateAudio = async (languageCode: string): Promise<void> => {
    try {
      if (state.formFields.length === 0) {
        throw new Error('No form fields to generate audio for');
      }
      
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      // Process fields in batches to avoid too many parallel requests
      const batchSize = 3;
      const fields = [...state.formFields];
      const updatedFields: FormField[] = [];
      
      for (let i = 0; i < fields.length; i += batchSize) {
        const batch = fields.slice(i, i + batchSize);
        
        // Create a batch of promises for parallel processing
        const promises = batch.map(async (field) => {
          try {
            const audioBase64 = await textToSpeech(
              field.explanation,
              languageCode
            );
            
            return {
              ...field,
              audioBase64,
            };
          } catch (error) {
            console.error(`Failed to generate audio for ${field.label}:`, error);
            return field; // Return original field without audio
          }
        });
        
        // Wait for all audio generation in this batch to complete
        const results = await Promise.all(promises);
        updatedFields.push(...results);
      }
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        formFields: updatedFields,
      }));
    } catch (error) {
      console.error('Audio generation failed:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to generate audio. Please try again.',
      }));
    }
  };

  const resetProcessor = () => {
    setState({
      isProcessing: false,
      formFields: [],
      error: null,
    });
  };

  return {
    ...state,
    processForm,
    translateExplanations,
    generateAudio,
    resetProcessor,
  };
}
