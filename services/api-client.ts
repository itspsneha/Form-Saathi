/**
 * Base API client for Sarvam AI services
 */

// Get API key from environment variables
// Use NEXT_PUBLIC_ prefix to expose the variable to the client-side code
const SARVAM_API_KEY = process.env.NEXT_PUBLIC_SARVAM_API_KEY || '';

// Base URL for Sarvam API
const BASE_URL = 'https://api.sarvam.ai';

// Maximum retries for API calls
const MAX_RETRIES = 2;

// Retry delay in milliseconds
const RETRY_DELAY = 1000;

/**
 * Generic fetch wrapper with authentication
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}, retryCount = 0) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Create a new headers object to avoid mutating the original
  const headers = new Headers(options.headers);
  
  // Add authentication header
  headers.set('api-subscription-key', SARVAM_API_KEY);
  
  // For FormData, let the browser set the Content-Type with the correct boundary
  if (options.body instanceof FormData) {
    // Don't set Content-Type for FormData
    headers.delete('Content-Type');
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Debug the request
  console.log(`Making request to ${endpoint}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);
  
  try {
    const response = await fetch(url, { 
      ...options, 
      headers 
    });
    
    // Debug the response
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Try to get more details about the error
      let errorDetails = '';
      try {
        const errorJson = await response.json();
        errorDetails = JSON.stringify(errorJson);
      } catch (e) {
        // If we can't parse JSON, try to get text
        try {
          errorDetails = await response.text();
        } catch (e2) {
          // If we can't get text either, just use status
          errorDetails = `Status: ${response.status}`;
        }
      }
      
      console.error(`API error: ${response.status} ${response.statusText}. Details: ${errorDetails}`);
      
      // For 500 errors, retry if we haven't reached the max retries
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        console.log(`Retrying request to ${endpoint} after ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchWithAuth(endpoint, options, retryCount + 1);
      }
      
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Handle file uploads with FormData
 */
export async function uploadFile(endpoint: string, formData: FormData) {
  // For multipart/form-data, we should NOT set the Content-Type header
  // The browser will automatically set it with the correct boundary
  return fetchWithAuth(endpoint, {
    method: 'POST',
    // Don't set Content-Type for multipart/form-data
    // Let the browser handle it automatically with the correct boundary
    headers: {
      // Explicitly remove Content-Type to let the browser set it
    },
    body: formData,
  });
}

/**
 * Handle JSON requests
 */
export async function postJson(endpoint: string, data: any) {
  return fetchWithAuth(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}
