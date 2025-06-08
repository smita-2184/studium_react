import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { topic, questionType, numberOfQuestions = 5 } = req.body;

    const prompt = `Generate ${numberOfQuestions} ${questionType} questions about ${topic} in mathematics. 
    For each question, provide:
    1. The question text
    2. Multiple choice options (4 options for multiple choice)
    3. The correct answer index (0-based)
    4. A brief explanation of the answer
    
    Format the response as a JSON array of objects with the following structure:
    {
      "question": string,
      "options": string[],
      "correctAnswer": number,
      "explanation": string
    }`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    const questions = JSON.parse(response || '[]');

    res.status(200).json({ questions });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ message: 'Error generating quiz' });
  }
} 