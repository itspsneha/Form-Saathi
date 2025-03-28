Sarvam Parse
Given a PDF, this API helps to get structured extraction of data in the document.The API returns a base64 encoded XML string containing the extracted data.

POST

https://api.sarvam.ai
/
parse
/
parsepdf

Try it
Headers
​
api-subscription-key
stringdefault:
Your unique subscription key for authenticating requests to the Sarvam AI Speech-to-Text API.
"
"Here are the steps to get your api key",
example="dxxxxxx-bxxx-4xxx-axxx-cxxxxxxxxxxx

Body
multipart/form-data
​
pdf
filerequired
Upload the PDF file you want to parse. This should be uploaded as a form input if you're using multipart/form-data Note: Sarvam Parse supports only English PDFs currently.

​
page_number
stringdefault:1
The page number you want to extract data from. This is a one-based index (meaning, the first page is 1).

​
sarvam_mode
enum<string>
The mode of parsing to use:

small: Use this mode for economical and fast parsing
large: Use this mode for highest precision parsing
Available options: small, large 
​
prompt_caching
enum<string>
Whether to cache the prompt for the parse request. This is useful when running multiple requests to the parsing endpoint.

Available options: true, false 
Response
200

200
application/json
Successful Response
​
output
string | null
The base64 encoded HTML string corresponding to the parsed page. The output will be an empty string if parsing fails for some reason.

const form = new FormData();
form.append("page_number", "1");
form.append("sarvam_mode", "large");
form.append("prompt_caching", "false");

const options = {method: 'POST', headers: {'Content-Type': 'multipart/form-data'}};

options.body = form;

fetch('https://api.sarvam.ai/parse/parsepdf', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));



#Language Identification
Endpoints
Language Identification
Identifies the language (e.g., en-IN, hi-IN) and script (e.g., Latin, Devanagari) of the input text, supporting multiple languages.

POST

https://api.sarvam.ai
/
text-lid

Try it
Headers
​
api-subscription-key
stringdefault:
Your unique subscription key for authenticating requests to the Sarvam AI APIs.
Here are the steps to get your api key

Body
application/json
​
input
stringrequired
The text input for language and script identification.

Response
200

200
application/json
Successful Response
​
request_id
string | nullrequired
​
language_code
string | null
The detected language code of the input text.

Available languages:

en-IN: English
hi-IN: Hindi
bn-IN: Bengali
gu-IN: Gujarati
kn-IN: Kannada
ml-IN: Malayalam
mr-IN: Marathi
od-IN: Odia
pa-IN: Punjabi
ta-IN: Tamil
te-IN: Telugu
​
script_code
string | null
The detected script code of the input text.

Available scripts:

Latn: Latin (Romanized script)
Deva: Devanagari (Hindi, Marathi)
Beng: Bengali
Gujr: Gujarati
Knda: Kannada
Mlym: Malayalam
Orya: Odia
Guru: Gurmukhi
Taml: Tamil
Telu: Telugu
const options = {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: '{"input":"<string>"}'
};

fetch('https://api.sarvam.ai/text-lid', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));


  #Speech to Text and Translation

  Speech to Text
Real-Time Speech to Text API
This API transcribes speech to text in multiple Indian languages and English. Supports real-time transcription for interactive applications.

Available Options:
Real-Time API (Current Endpoint): For quick responses under 30 seconds with immediate results
Batch API: For longer audio files, requires following a notebook script - View Notebook
Supports diarization (speaker identification)
Note:
Pricing differs for Real-Time and Batch APIs
Diarization is only available in Batch API with separate pricing
Please refer to dashboard.sarvam.ai for detailed pricing information
POST

https://api.sarvam.ai
/
speech-to-text

Try it
Headers
​
api-subscription-key
stringdefault:
Your unique subscription key for authenticating requests to the Sarvam AI Speech-to-Text API.
Here are the steps to get your api key

Body
multipart/form-data
​
file
filerequired
The audio file to transcribe. Supported formats are WAV (.wav) and MP3 (.mp3).
The API works best with audio files sampled at 16kHz. If the audio contains multiple channels, they will be merged into a single channel.

​
model
enum<string>
Specifies the model to use for speech-to-text conversion.
Note:- Default model is saarika:v2

Available options: saarika:v1, saarika:v2, saarika:flash 
​
language_code
enum<string>
Specifies the language of the input audio. This parameter is required to ensure accurate transcription.
For the saarika:v1 model, this parameter is mandatory.
For the saarika:v2 model, it is optional.
unknown: Use this when the language is not known; the API will detect it automatically.
Note:- that the saarika:v1 model does not support unknown language code.

Available options: unknown, hi-IN, bn-IN, kn-IN, ml-IN, mr-IN, od-IN, pa-IN, ta-IN, te-IN, en-IN, gu-IN 
​
with_timestamps
booleandefault:false
Enables timestamps in the response. If set to true, the response will include timestamps in the transcript.

​
with_diarization
booleandefault:false
Enables speaker diarization, which identifies and separates different speakers in the audio.
When set to true, the API will provide speaker-specific segments in the response.
Note: This parameter is currently in Beta mode.

​
num_speakers
integer | null
Number of speakers to be detected in the audio. This is used when with_diarization is set to true.

Response
200

200
application/json
Successful Response
​
request_id
string | nullrequired
​
transcript
stringrequired
The transcribed text from the provided audio file.

Example:
"नमस्ते, आप कैसे हैं?"

​
timestamps
object | null
Contains timestamps for the transcribed text. This field is included only if with_timestamps is set to true


Show child attributes

Example:
{
  "timestamps": {
    "end_time_seconds": [16.27],
    "start_time_seconds": [0],
    "words": [
      "Good afternoon, this is Naveen from Sarvam."
    ]
  }
}
​
diarized_transcript
object | null
Diarized transcript of the provided speech


Show child attributes

​
language_code
string | null
This will return the BCP-47 code of language spoken in the input. If multiple languages are detected, this will return language code of most predominant spoken language. If no language is detected, this will be null

const form = new FormData();
form.append("model", "saarika:v2");
form.append("language_code", "unknown");
form.append("with_timestamps", "false");
form.append("with_diarization", "false");
form.append("num_speakers", "123");

const options = {method: 'POST', headers: {'Content-Type': 'multipart/form-data'}};

options.body = form;

fetch('https://api.sarvam.ai/speech-to-text', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));


Translate Text
Translation converts text from one language to another while preserving its meaning. For Example: ‘मैं ऑफिस जा रहा हूँ’ translates to ‘I am going to the office’ in English, where the script and language change, but the original meaning remains the same.

Available languages:

en-IN: English
hi-IN: Hindi
bn-IN: Bengali
gu-IN: Gujarati
kn-IN: Kannada
ml-IN: Malayalam
mr-IN: Marathi
od-IN: Odia
pa-IN: Punjabi
ta-IN: Tamil
te-IN: Telugu
For hands-on practice, you can explore the notebook tutorial on Translate API Tutorial.

POST

https://api.sarvam.ai
/
translate

Try it
Headers
​
api-subscription-key
stringdefault:
Your unique subscription key for authenticating requests to the Sarvam AI APIs.
Here are the steps to get your api key

Body
application/json
​
input
stringrequired
The text you want to translate. This is the input text that will be processed by the translation model.

Maximum length: 1000
​
source_language_code
enum<string>required
The language code of the input text. This specifies the source language for translation.

Note: The source language should either be an Indic language or English. As we supports both Indic-to-English and English-to-Indic translation.

Available options: auto, en-IN, hi-IN, bn-IN, gu-IN, kn-IN, ml-IN, mr-IN, od-IN, pa-IN, ta-IN, te-IN 
​
target_language_code
enum<string>required
The language code of the translated text. This specifies the target language for translation.

Note:The target language should either be an Indic language or English. As we supports both Indic-to-English and English-to-Indic translation.

Available options: en-IN, hi-IN, bn-IN, gu-IN, kn-IN, ml-IN, mr-IN, od-IN, pa-IN, ta-IN, te-IN 
​
speaker_gender
enum<string>
Please specify the gender of the speaker for better translations. This feature is only supported for the code-mixed translation models currently.

Available options: Male, Female 
​
mode
enum<string>
Specifies the tone or style of the translation. Choose between formal, classic-colloquial and modern-colloquial translations. Default is formal.

Available options: formal, modern-colloquial, classic-colloquial, code-mixed 
​
model
enum<string>
Specifies the translation model to use. Currently, only one model is supported.Note:- This parameter is optional but will be deprecated by the end of January; avoid including it in your requests.

Available options: mayura:v1 
​
enable_preprocessing
booleandefault:false
This will enable custom preprocessing of the input text which can result in better translations.

​
output_script
enum<string> | null
output_script: This is an optional parameter which controls the transliteration style applied to the output text.

Transliteration: Converting text from one script to another while preserving pronunciation.

We support transliteration with four options:

null(default): No transliteration applied.

roman: Transliteration in Romanized script.

fully-native: Transliteration in the native script with formal style.

spoken-form-in-native: Transliteration in the native script with spoken style.

Example:
English: Your EMI of Rs. 3000 is pending.
Default modern translation: आपका Rs. 3000 का EMI pending है (when null is passed).

With postprocessing enabled, we provide the following style of outputs:

roman output: aapka Rs. 3000 ka EMI pending hai.
fully-native output: आपका रु. 3000 का ई.एम.ऐ. पेंडिंग है।
spoken-form-in-native output: आपका थ्री थाउजेंड रूपीस का ईएमअइ पेंडिंग है।
Available options: roman, fully-native, spoken-form-in-native 
​
numerals_format
enum<string>
numerals_format is an optional parameter with two options:

international (default): Uses regular numerals (0-9).
native: Uses language-specific native numerals.
Example:
If international format is selected, we use regular numerals (0-9). For example: मेरा phone number है: 9840950950.
If native format is selected, we use language-specific native numerals, like: मेरा phone number है: ९८४०९५०९५०.
Available options: international, native 
Response
200

200
application/json
Successful Response
​
request_id
string | nullrequired
​
translated_text
stringrequired
Translated text result in the requested target language.

​
source_language_code
stringrequired
Detected or provided source language of the input text.
const options = {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: '{"input":"<string>","source_language_code":"auto","target_language_code":"en-IN","speaker_gender":"Female","mode":"formal","model":"mayura:v1","enable_preprocessing":false,"output_script":"roman","numerals_format":"international"}'
};

fetch('https://api.sarvam.ai/translate', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));

  #Text to Speech
Text to Speech
This is the model to convert text into spoken audio. The output is a wave file encoded as a base64 string.

POST

https://api.sarvam.ai
/
text-to-speech

Try it
Headers
​
api-subscription-key
stringdefault:
Your unique subscription key for authenticating requests to the Sarvam AI Speech-to-Text API.
Here are the steps to get your api key

Body
application/json
​
inputs
string[]required
The text(s) to be converted into speech. Each text should be no longer than 500 characters. You can send up to 3 texts in a single API call. The text can be code-mixed, combining English and Indic languages.

​
target_language_code
enum<string>required
The language of the text is BCP-47 format

Available options: bn-IN, en-IN, gu-IN, hi-IN, kn-IN, ml-IN, mr-IN, od-IN, pa-IN, ta-IN, te-IN 
​
speaker
enum<string> | nulldefault:meera
The speaker to be used for the output audio. If not provided, Meera will be used as default.

Available options: meera, pavithra, maitreyi, arvind, amol, amartya, diya, neel, misha, vian, arjun, maya, anushka, abhilash, manisha, vidya, arya, karun, hitesh 
​
pitch
number | nulldefault:0
Controls the pitch of the audio. Lower values result in a deeper voice, while higher values make it sharper. The suitable range is between -0.75 and 0.75. Default is 0.0.

Required range: -1 <= x <= 1
​
pace
number | nulldefault:1
Controls the speed of the audio. Lower values result in slower speech, while higher values make it faster. The suitable range is between 0.5 and 2.0. Default is 1.0.

Required range: 0.3 <= x <= 3
​
loudness
number | nulldefault:1
Controls the loudness of the audio. Lower values result in quieter audio, while higher values make it louder. The suitable range is between 0.3 and 3.0. Default is 1.0.

Required range: 0.1 <= x <= 3
​
speech_sample_rate
enum<integer> | nulldefault:22050
Specifies the sample rate of the output audio. Supported values are 8000, 16000, and 22050 Hz. If not provided, the default is 22050 Hz.

Available options: 8000, 16000, 22050 
​
enable_preprocessing
booleandefault:false
Controls whether normalization of English words and numeric entities (e.g., numbers, dates) is performed. Set to true for better handling of mixed-language text. Default is false.

​
model
enum<string>
Specifies the model to use for text-to-speech conversion. Default is bulbul:v1.

Available options: bulbul:v1, bulbul:v2 
Response
200

200
application/json
Successful Response
​
request_id
string | nullrequired
​
audios
string[]required
The output audio files in WAV format, encoded as base64 strings. Each string corresponds to one of the input texts.
const options = {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: '{"inputs":["<string>"],"target_language_code":"bn-IN","speaker":"meera","pitch":0,"pace":1.65,"loudness":1.55,"speech_sample_rate":8000,"enable_preprocessing":false,"model":"bulbul:v1"}'
};

fetch('https://api.sarvam.ai/text-to-speech', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));