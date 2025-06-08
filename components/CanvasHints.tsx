import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface CanvasHintsProps {
  canvasImage: string | null;
  isActive: boolean;
}

export function CanvasHints({ canvasImage, isActive }: CanvasHintsProps) {
  const [hints, setHints] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const generateHints = async () => {
      if (!canvasImage || !isActive) return;

      // Clear previous hints
      setHints([]);
      setIsLoading(true);
      setError(null);

      try {
        // Get Gemini API key from Firestore
        const apiKeyDoc = await getDoc(doc(db, 'api_keys', 'gemini'));
        if (!apiKeyDoc.exists()) {
          throw new Error('Gemini API key not found');
        }
        const apiKey = apiKeyDoc.data().gemini;

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

        // Generate content
        const result = await model.generateContent({
          contents: [{
            parts: [
              { text: 'Analyze this mathematical equation or problem and provide helpful hints for solving it. Focus on step-by-step guidance and key concepts.' },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: canvasImage
                }
              }
            ]
          }]
        });

        const response = await result.response;
        const text = response.text();
        
        // Split the response into individual hints
        const hintList = text.split('\n').filter((hint: string) => hint.trim().length > 0);
        setHints(hintList);
      } catch (err) {
        console.error('Error generating hints:', err);
        setError('Failed to generate hints. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the hint generation
    if (canvasImage && isActive) {
      timeoutId = setTimeout(generateHints, 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [canvasImage, isActive]);

  if (!isActive) return null;

  return (
    <div className="w-full h-full bg-zinc-900 border-l border-zinc-800 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-4">Solving Hints</h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2 text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Analyzing your work...</span>
        </div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : hints.length > 0 ? (
        <div className="space-y-4">
          {hints.map((hint, index) => (
            <div
              key={index}
              className="p-3 bg-zinc-800 rounded-lg text-zinc-200 text-sm"
            >
              {hint}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-zinc-400 text-sm">
          Start writing or drawing to get hints...
        </div>
      )}
    </div>
  );
} 