import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Switched to Groq API - 100% Free, NO Credit Card Required, and insanely fast!
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export async function processAudioRecording(uri: string) {
    if (!GROQ_API_KEY) {
        throw new Error("Missing EXPO_PUBLIC_GROQ_API_KEY in .env");
    }

    // 1. Transcribe audio to text using Groq's super fast Whisper model
    const transcription = await transcribeAudio(uri);

    if (!transcription || transcription.trim() === '') {
        throw new Error("Could not transcribe audio, it was empty.");
    }

    // 2. Extract patient data from transcription using Groq's Llama 3 model
    const extractedData = await extractPatientData(transcription);
    return { ...extractedData, rawTranscription: transcription };
}

async function transcribeAudio(uri: string): Promise<string> {
    const formData = new FormData();

    const fileType = Platform.OS === 'ios' ? 'audio/x-m4a' : 'audio/m4a';
    const fileName = uri.split('/').pop() || 'recording.m4a';

    formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: fileName,
        type: fileType,
    } as any);

    // Groq's free tier Whisper model
    formData.append('model', 'whisper-large-v3');

    console.log("Sending to Groq API...");

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'multipart/form-data',
        },
        body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error?.message || "Failed to transcribe audio.");
    }

    console.log("Transcription result:", result.text);
    return result.text;
}

async function extractPatientData(transcription: string) {
    const systemPrompt = `
You are a medical assistant parsing transcribed speech into structured JSON format.
The user will provide a transcription and you must extract the patient's data according to the exact schema.

Schema JSON object to output:
{
  "name": "string (Full Name)",
  "idNumber": "string",
  "dob": "string (MM/DD/YYYY)",
  "gender": "string",
  "phone": "string",
  "email": "string",
  "emergencyContact": "string (Name and Phone)",
  "height": "string",
  "weight": "string",
  "notes": "string",
  "medicines": [
    {
      "name": "string",
      "totalPillsPrescribed": "string (number)",
      "pillsPerDayToBeTaken": "string (number)",
      "daysPerWeekToTakeThePrescription": "string (number)",
      "pillSchedule": "string (e.g. 8:00 AM Daily)",
      "refillOrNot": boolean
    }
  ]
}

Return ONLY a valid JSON object matching this schema. If a value is not mentioned or unknown, set it to an empty string "". If no medicines are mentioned, leave the array empty. Ensure the refillOrNot is a boolean. Do not include markdown wrappers.
`;

    console.log("Asking Llama 3.1 8B on Groq to extract fields...");

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile', // Free and MASSIVELY smarter on Groq for JSON arrays
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Transcription: "${transcription}"` }
            ],
            temperature: 0.1,
        }),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error?.message || "Failed to parse data with LLM.");
    }

    let content = result.choices[0].message.content;
    content = content.replace(/^```json/g, '').replace(/```$/g, '').trim();

    return JSON.parse(content);
}
