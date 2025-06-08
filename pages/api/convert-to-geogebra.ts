import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { equation } = req.body;

    if (!equation) {
      return res.status(400).json({ error: 'No equation provided' });
    }

    console.log('Converting equation to GeoGebra format:', equation);

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

    console.log('API key found, initializing Gemini for GeoGebra conversion...');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log('Sending equation to Gemini for GeoGebra conversion...');

    const prompt = `Convert this LaTeX equation to GeoGebra format for graphing.

LaTeX equation: ${equation}

Please convert this to a GeoGebra-compatible equation format. Follow these rules:

1. For functions, use f(x) = format (e.g., f(x) = x^2)
2. For derivatives, convert to the actual function (e.g., d/dx x^2 becomes f(x) = 2*x)
3. Use * for multiplication explicitly
4. Use ^ for exponents
5. Use sqrt() for square roots
6. Use sin(), cos(), tan(), ln(), log() for functions
7. Use pi for π, e for Euler's number
8. For parametric equations, use separate x(t) and y(t) functions
9. For implicit equations, try to solve for y if possible

Examples:
- LaTeX: x^2 + y^2 = 1 → GeoGebra: x^2 + y^2 = 1
- LaTeX: \\frac{d}{dx} x^2 → GeoGebra: f(x) = 2*x
- LaTeX: y = x^2 → GeoGebra: f(x) = x^2
- LaTeX: \\sin(x) → GeoGebra: f(x) = sin(x)

Return ONLY the GeoGebra equation format, nothing else. If the equation cannot be graphed, return "Cannot graph this equation".`;

    const result = await (model as any).generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ],
        },
      ],
    });

    const response = await result.response;
    const geogebraEquation = response.text().trim();

    console.log('Received GeoGebra conversion:', geogebraEquation);

    // Clean up the response
    let cleanEquation = geogebraEquation
      .replace(/^(GeoGebra:|Equation:|Result:)/i, '')
      .replace(/```/g, '')
      .replace(/^f\(x\)\s*=\s*/, '')
      .trim();

    // Validate that it's not an error message
    if (cleanEquation.toLowerCase().includes('cannot graph') || 
        cleanEquation.toLowerCase().includes('error') ||
        cleanEquation.length > 200) {
      return res.status(400).json({ 
        error: 'Equation cannot be converted to graphable format',
        details: cleanEquation
      });
    }

    return res.status(200).json({ 
      success: true, 
      geogebraEquation: cleanEquation,
      originalEquation: equation,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error converting to GeoGebra:', error);
    return res.status(500).json({ 
      error: 'Failed to convert equation to GeoGebra format',
      details: error.message 
    });
  }
} 