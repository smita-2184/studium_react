import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, prompt = "Analyze this drawing and explain what you see. If it contains mathematical content, help solve or explain it." } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    console.log('Received image data, size:', imageData.length);

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

    console.log('API key found, initializing Gemini...');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log('Sending image to Gemini for analysis...');

    // Use the correct Gemini API format with parts array
    const result = await (model as any).generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageData,
              },
            },
          ],
        },
      ],
    });

    const response = await result.response;
    const text = response.text();

    console.log('Received response from Gemini:', text.substring(0, 100) + '...');

    return res.status(200).json({ 
      success: true, 
      analysis: text,
      timestamp: new Date().toISOString(),
      imageReceived: true,
      imageSize: imageData.length
    });

  } catch (error: any) {
    console.error('Error analyzing image:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
} 