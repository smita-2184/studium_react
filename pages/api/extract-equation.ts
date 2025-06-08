import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    console.log('Received image data for equation extraction, size:', imageData.length);

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

    console.log('API key found, initializing Gemini for equation extraction...');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log('Sending image to Gemini for equation extraction...');

    const prompt = `Please analyze this image and extract any mathematical equations you see. 
    
    Return ONLY the mathematical equations in LaTeX format, one per line. 
    If there are multiple equations, separate them with line breaks.
    If there are no mathematical equations, return "No equations found".
    
    Do not include any explanations, just the LaTeX equations.
    
    Examples of expected output:
    x^2 + y^2 = r^2
    \\frac{d}{dx}(x^2) = 2x
    \\int_0^1 x dx = \\frac{1}{2}`;

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

    console.log('Received equation extraction response:', text.substring(0, 100) + '...');

    // Clean up the response to extract just the equations
    let equations = text.trim();
    
    // Remove common prefixes that Gemini might add
    equations = equations.replace(/^(Here are the equations?:?|The equations? (?:are|is):?|I found these equations?:?)/i, '').trim();
    equations = equations.replace(/^[-*•]\s*/gm, ''); // Remove bullet points
    
    return res.status(200).json({ 
      success: true, 
      equations: equations,
      rawResponse: text,
      timestamp: new Date().toISOString(),
      imageReceived: true,
      imageSize: imageData.length
    });

  } catch (error: any) {
    console.error('Error extracting equations:', error);
    return res.status(500).json({ 
      error: 'Failed to extract equations',
      details: error.message 
    });
  }
} 