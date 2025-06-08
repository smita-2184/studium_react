import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid topic' });
    }

    // Get Gemini API key from Firestore
    const apiKeyDoc = await getDoc(doc(db, 'api_keys', 'gemini'));
    if (!apiKeyDoc.exists()) {
      return res.status(500).json({ error: 'API key not found' });
    }
    const apiKey = apiKeyDoc.data().gemini;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a flashcard generator for students. For the topic: "${topic}", generate 5-8 concise Q&A flashcards as a JSON array. Each card should have a 'front' (question or term) and a 'back' (answer or explanation). Only output valid JSON, no extra text.

Example:
[
  { "front": "What is ...?", "back": "..." },
  ...
]
`;

    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    let flashcards = [];
    try {
      // Find the first [ ... ] block in the response and parse it (no /s flag)
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        flashcards = JSON.parse(match[0]);
      } else {
        flashcards = JSON.parse(text);
      }
    } catch (err) {
      return res.status(500).json({ error: 'Failed to parse flashcards', details: (err as Error).message, raw: text });
    }
    if (!Array.isArray(flashcards)) {
      return res.status(500).json({ error: 'Invalid flashcards format', raw: text });
    }
    // Only keep cards with both front and back
    flashcards = flashcards.filter((c: any) => c.front && c.back);
    res.status(200).json({ flashcards });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate flashcards', details: error.message });
  }
} 