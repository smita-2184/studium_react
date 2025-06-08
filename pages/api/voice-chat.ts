import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    const { audioData, language = 'en-US', voice = 'Kore', testMode = false, testText = '' } = req.body;

    if (!audioData && !testMode) {
      res.write('data: ' + JSON.stringify({ error: 'No audio data provided' }) + '\n\n');
      return res.end();
    }

    console.log('Processing voice chat request...', testMode ? '(TEST MODE)' : '');

    // Get API key from Firestore
    const apiKeyDoc = await getDoc(doc(db, 'api_keys', 'gemini'));
    if (!apiKeyDoc.exists()) {
      console.error('API key document not found');
      res.write('data: ' + JSON.stringify({ error: 'API key not found' }) + '\n\n');
      return res.end();
    }

    const apiKey = apiKeyDoc.data().gemini;
    if (!apiKey) {
      console.error('API key not configured in document');
      res.write('data: ' + JSON.stringify({ error: 'API key not configured' }) + '\n\n');
      return res.end();
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);

    let userTranscript = '';

    if (testMode) {
      // Test mode - skip transcription, use provided text
      console.log('Test mode - using provided text...');
      userTranscript = 'Test audio request';
      res.write('data: ' + JSON.stringify({ userTranscript }) + '\n\n');
      
      const testResponse = testText || 'Hello! This is a test of the audio system. Can you hear me clearly?';
      const words = testResponse.split(' ');
      
      for (const word of words) {
        await new Promise(resolve => setTimeout(resolve, 100));
        res.write('data: ' + JSON.stringify({ aiResponseChunk: word + ' ' }) + '\n\n');
      }
    } else {
      // Step 1: Transcribe the audio using Gemini 2.0 Flash
      console.log('Transcribing audio...');
      const transcriptionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const transcriptionResult = await (transcriptionModel as any).generateContent({
        contents: [{
          role: "user",
          parts: [
            {
              text: "Generate a transcript of the speech. Only return the transcribed text, nothing else."
            },
            {
              inlineData: {
                mimeType: "audio/webm",
                data: audioData,
              },
            }
          ]
        }]
      });

      userTranscript = transcriptionResult.response.text().trim();
      console.log('User transcript:', userTranscript);
      
      // Send transcription immediately
      res.write('data: ' + JSON.stringify({ userTranscript }) + '\n\n');

      if (!userTranscript) {
        res.write('data: ' + JSON.stringify({ error: 'Could not transcribe audio' }) + '\n\n');
        return res.end();
      }

      // Step 2: Generate AI response using Gemini 2.0 Flash
      console.log('Generating AI response...');
      const chatModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `${getSystemInstruction(language)}\n\nUser said: "${userTranscript}"\n\nRespond in 30-40 words maximum. Be direct, helpful, and conversational. Focus only on answering their specific question.`;

      const result = await chatModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Stream the response word by word to simulate streaming
      const words = text.split(' ');
      for (const word of words) {
        res.write('data: ' + JSON.stringify({ aiResponseChunk: word + ' ' }) + '\n\n');
        // Add a small delay between words to simulate natural typing
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Send completion signal with newline
      res.write('data: ' + JSON.stringify({ done: true }) + '\n\n');
    }

    return res.end();

  } catch (error: any) {
    console.error('Error in voice chat:', error);
    res.write('data: ' + JSON.stringify({
      error: 'Voice chat processing failed',
      details: error.message
    }) + '\n\n');
    return res.end();
  }
}

function getSystemInstruction(language: string): string {
  const instructions = {
    'en-US': `You are a helpful math tutor. Keep responses SHORT and conversational.
    - Maximum 30-40 words per response
    - Be direct and to the point
    - Answer the specific question asked
    - Don't over-explain unless asked
    - Use simple, friendly language
    - If it's not math-related, politely redirect to math topics`,
    
    'de-DE': `Du bist ein hilfreicher Mathe-Tutor. Halte Antworten KURZ und gesprächig.
    - Maximal 30-40 Wörter pro Antwort
    - Sei direkt und auf den Punkt
    - Beantworte die spezifische Frage
    - Erkläre nicht zu viel, außer wenn gefragt
    - Verwende einfache, freundliche Sprache
    - Falls es nicht mathe-bezogen ist, leite höflich zu Mathe-Themen um`
  };

  return instructions[language as keyof typeof instructions] || instructions['en-US'];
} 