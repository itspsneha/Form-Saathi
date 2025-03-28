/**
 * OpenAI Client
 * A more robust implementation using the official OpenAI SDK
 */

import OpenAI from 'openai';

// Get API key from environment variables
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Create OpenAI client instance
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

/**
 * Analyze a form image using GPT-4 Vision
 * @param base64Image Base64 encoded image data
 * @returns Extracted form fields with explanations
 */
export async function analyzeFormWithVision(base64Image: string): Promise<{ label: string, explanation: string }[]> {
  try {
    console.log('Analyzing form with OpenAI Vision API...');
    
    // Create the API request
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes form images and extracts form fields with explanations."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this form image. Extract all form fields and provide explanations for each field. Return the result as a JSON array where each item has 'label' and 'explanation' properties."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });
    
    console.log('OpenAI response received:', response.choices[0].message);
    
    // Extract the content from the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }
    
    console.log('Raw content from OpenAI:', content.substring(0, 200) + '...');
    
    // Try to parse the JSON from the response
    try {
      // First check if the content contains a JSON array
      const jsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/g);
      if (jsonMatch && jsonMatch.length > 0) {
        try {
          const formFields = JSON.parse(jsonMatch[0]);
          console.log('Extracted form fields from JSON array:', formFields);
          return formFields;
        } catch (innerError) {
          console.error('Error parsing JSON array match:', innerError);
          // Continue to next approach
        }
      }
      
      // Try to extract JSON objects individually
      const objectMatch = content.match(/\{[\s\S]*?"label"[\s\S]*?"explanation"[\s\S]*?\}/g);
      if (objectMatch && objectMatch.length > 0) {
        try {
          // Combine individual objects into an array
          const combinedJson = '[' + objectMatch.join(',') + ']';
          const formFields = JSON.parse(combinedJson);
          console.log('Extracted form fields from individual objects:', formFields);
          return formFields;
        } catch (innerError) {
          console.error('Error parsing individual objects:', innerError);
          // Continue to next approach
        }
      }
      
      // If no structured JSON found, use regex to extract field information
      console.log('No structured JSON found, using text extraction...');
      return extractFieldsFromText(content);
    } catch (parseError) {
      console.error('Error in JSON parsing process:', parseError);
      
      // If all parsing attempts fail, manually extract fields
      console.log('Attempting to manually extract fields from text...');
      return extractFieldsFromText(content);
    }
  } catch (error) {
    console.error('Error in OpenAI Vision API:', error);
    return getDefaultFormFields();
  }
}

/**
 * Extract fields from text response when JSON parsing fails
 */
function extractFieldsFromText(text: string): { label: string, explanation: string }[] {
  const fields: { label: string, explanation: string }[] = [];
  
  console.log('Extracting fields from text content...');
  
  // Check if the response starts with "Here are the form fields"
  if (text.includes('Here are the form fields') || text.includes('Here is the form field') || 
      text.includes('The form has the following fields') || text.includes('I can see the following fields')) {
    console.log('Detected OpenAI structured response format');
  }
  
  // Look for patterns like "Field: Explanation" or "Field - Explanation"
  const lines = text.split('\n');
  
  // Pattern for numbered or bulleted items like "1. Field: Explanation" or "- Field: Explanation"
  const itemPattern = /^\s*(?:[0-9]+\.|[-*•])\s+([^:]+):\s*(.+)$/;
  
  // Pattern for field-explanation pairs without bullets
  const fieldPattern = /^\s*([A-Za-z\s]+(?:Name|Address|ID|Code|Date|Status|Jurisdiction|Entity|At))\s*[:\-]\s*(.+)$/;
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Try to match numbered/bulleted items first
    const itemMatch = line.match(itemPattern);
    if (itemMatch) {
      fields.push({
        label: itemMatch[1].trim(),
        explanation: itemMatch[2].trim()
      });
      continue;
    }
    
    // Try to match field-explanation pairs
    const fieldMatch = line.match(fieldPattern);
    if (fieldMatch) {
      fields.push({
        label: fieldMatch[1].trim(),
        explanation: fieldMatch[2].trim()
      });
      continue;
    }
    
    // Try different patterns as fallback
    const colonPattern = line.match(/^[*-]?\s*([^:]+):\s*(.+)$/);
    if (colonPattern) {
      fields.push({
        label: colonPattern[1].trim(),
        explanation: colonPattern[2].trim()
      });
      continue;
    }
    
    const dashPattern = line.match(/^[*-]?\s*([^-]+)-\s*(.+)$/);
    if (dashPattern) {
      fields.push({
        label: dashPattern[1].trim(),
        explanation: dashPattern[2].trim()
      });
      continue;
    }
  }
  
  console.log(`Extracted ${fields.length} fields from text`);
  
  // If we couldn't extract any fields, return default fields
  if (fields.length === 0) {
    console.log('No fields extracted, using default fields');
    return getDefaultFormFields();
  }
  
  return fields;
}

/**
 * Get default form fields as a fallback
 */
function getDefaultFormFields(): { label: string, explanation: string }[] {
  return [
    { label: 'Name', explanation: 'Your full name as it appears on official documents.' },
    { label: 'Address', explanation: 'Your current residential address including house number, street name, city, and PIN code.' },
    { label: 'Mobile', explanation: 'Your 10-digit mobile phone number.' },
    { label: 'Email', explanation: 'Your email address, if you have one.' },
    { label: 'Date of Birth', explanation: 'Your date of birth in DD/MM/YYYY format.' },
    { label: 'Gender', explanation: 'Your gender (Male/Female/Other).' },
    { label: 'Occupation', explanation: 'Your current job or profession.' }
  ];
}
