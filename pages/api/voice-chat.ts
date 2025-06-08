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

  try {
    const { audioData, language = 'en-US', voice = 'Kore', testMode = false, testText = '' } = req.body;

    if (!audioData && !testMode) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    console.log('Processing voice chat request...', testMode ? '(TEST MODE)' : '');

    // Get API key from Firestore
    const apiKeyDoc = await getDoc(doc(db, 'api_keys', 'gemini'));
    if (!apiKeyDoc.exists()) {
      console.error('API key document not found');
      return res.status(500).json({ error: 'API key not found' });
    }

    const apiKey = apiKeyDoc.data().gemini;
    if (!apiKey) {
      console.error('API key not configured in document');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);

    let userTranscript = '';
    let aiResponse = '';
    let audioResponseBase64: string | null = null;

    if (testMode) {
      // Test mode - skip transcription, use provided text
      console.log('Test mode - using provided text...');
      userTranscript = 'Test audio request';
      aiResponse = testText || 'Hello! This is a test of the audio system. Can you hear me clearly?';
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

      if (!userTranscript) {
        return res.status(400).json({ error: 'Could not transcribe audio' });
      }

      // Step 2: Generate AI response using Gemini 2.0 Flash
      console.log('Generating AI response...');
      const chatModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `${getSystemInstruction(language)}\n\nUser said: "${userTranscript}"\n\nRespond in 30-40 words maximum. Be direct, helpful, and conversational. Focus only on answering their specific question.`;

      const result = await chatModel.generateContent(prompt);
      const response = await result.response;
      aiResponse = response.text().trim();
      console.log('AI response:', aiResponse);

      // === Step 3: Convert AI response text to speech ===
      console.log('Generating TTS audio...');
      try {
        const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

        // Types may not include speechConfig yet, so cast to any
        const ttsResult = await (ttsModel as any).generateContent({
          contents: [{ parts: [{ text: aiResponse }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice }
              }
            }
          }
        });

        audioResponseBase64 = (ttsResult as any)?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        if (audioResponseBase64) {
          console.log('TTS audio generated, length:', audioResponseBase64.length);
        } else {
          console.warn('TTS audio generation returned empty data');
        }
      } catch (ttsErr) {
        console.error('TTS generation failed:', ttsErr);
      }
    }

    // If testMode (no audioData) but we still might want audio via TTS
    if (testMode) {
      try {
        const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });
        const ttsResult = await (ttsModel as any).generateContent({
          contents: [{ parts: [{ text: aiResponse }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice }
              }
            }
          }
        });
        audioResponseBase64 = (ttsResult as any)?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
      } catch (err) {
        console.error('TTS testMode generation failed:', err);
      }
    }

    console.log('Voice chat processing completed successfully');

    return res.status(200).json({
      success: true,
      userTranscript,
      aiResponse,
      audioResponse: audioResponseBase64,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error in voice chat:', error);
    return res.status(500).json({
      error: 'Voice chat processing failed',
      details: error.message
    });
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