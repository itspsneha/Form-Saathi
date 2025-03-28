/**
 * OpenAI Service
 * Handles integration with OpenAI's GPT Vision API for form image analysis
 */

// Get API key from environment variables
// Use NEXT_PUBLIC_ prefix to expose the variable to the client-side code
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Base URL for OpenAI API - using the latest API version
const BASE_URL = 'https://api.openai.com/v1';

// Debug flag
const DEBUG = true;

/**
 * Analyze a form image using OpenAI's GPT Vision
 * @param imageBase64 Base64 encoded image data
 * @returns Extracted form fields and explanations
 */
export async function analyzeFormImage(imageBase64: string): Promise<{ label: string, explanation: string }[]> {
  try {
    console.log('Analyzing form image with GPT Vision...');
    
    if (DEBUG) {
      console.log('OpenAI API Key (first 10 chars):', OPENAI_API_KEY?.substring(0, 10) + '...');
    }

    // Prepare the request payload
    const payload = {
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes form images and extracts form fields with explanations. For each field, provide a label and a brief explanation of what information should be entered.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this form image. Extract all form fields and provide explanations for each field. Return the result as a JSON array where each item has "label" and "explanation" properties.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    };
    
    if (DEBUG) {
      console.log('Request payload:', JSON.stringify(payload).substring(0, 500) + '...');
    }

    // Make the API request
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (DEBUG) {
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    }

    if (!response.ok) {
      let errorMessage = `Status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = JSON.stringify(errorData);
        console.error('OpenAI API error details:', errorData);
      } catch (e) {
        console.error('Failed to parse error response:', e);
        try {
          errorMessage = await response.text();
        } catch (e2) {
          console.error('Failed to get error text:', e2);
        }
      }
      console.error(`OpenAI API error (${response.status}):`, errorMessage);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('GPT Vision response:', data);

    // Parse the response content
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in GPT Vision response');
    }

    // Try to extract JSON from the response
    try {
      // Look for JSON array in the response
      // Using a more compatible regex without the 's' flag
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const formFields = JSON.parse(jsonMatch[0]);
        console.log('Extracted form fields:', formFields);
        return formFields;
      }

      // If no JSON array found, try to parse the entire content as JSON
      const formFields = JSON.parse(content);
      console.log('Extracted form fields:', formFields);
      return formFields;
    } catch (parseError) {
      console.error('Error parsing GPT Vision response:', parseError);
      
      // If parsing fails, manually extract fields using regex
      console.log('Attempting to manually extract fields from response...');
      const fields = extractFieldsFromText(content);
      return fields;
    }
  } catch (error) {
    console.error('Error analyzing form image:', error);
    
    // For debugging purposes, log the full error
    if (DEBUG) {
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
    
    // Use local processing as fallback
    console.log('Falling back to local form field extraction...');
    return getDefaultFormFields();
  }
}

/**
 * Get default form fields as a fallback
 */
function getDefaultFormFields() {
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

/**
 * Extract fields from text response when JSON parsing fails
 * @param text Response text from GPT Vision
 * @returns Extracted form fields
 */
function extractFieldsFromText(text: string): { label: string, explanation: string }[] {
  const fields: { label: string, explanation: string }[] = [];
  
  // Look for patterns like "Field: Explanation" or "Field - Explanation"
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Try different patterns
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
  
  // If we couldn't extract any fields, return default fields
  if (fields.length === 0) {
    return [
      { label: 'Name', explanation: 'Your full name as it appears on official documents.' },
      { label: 'Address', explanation: 'Your current residential address including house number, street name, city, and PIN code.' },
      { label: 'Mobile', explanation: 'Your 10-digit mobile phone number.' },
      { label: 'Email', explanation: 'Your email address, if you have one.' },
      { label: 'Date of Birth', explanation: 'Your date of birth in DD/MM/YYYY format.' }
    ];
  }
  
  return fields;
}
