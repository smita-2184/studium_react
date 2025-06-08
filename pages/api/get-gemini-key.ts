import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from Firestore (same as other endpoints)
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

    res.status(200).json({ apiKey });
  } catch (error: any) {
    console.error('Error getting API key:', error);
    return res.status(500).json({ error: 'Failed to get API key', details: error.message });
  }
} 