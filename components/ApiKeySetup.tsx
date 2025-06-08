import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

const ApiKeySetup: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage('Please enter an API key');
      return;
    }

    setIsLoading(true);
    try {
      await setDoc(doc(db, 'api_keys', 'gemini'), {
        gemini: apiKey.trim(),
        updatedAt: new Date().toISOString()
      });
      setMessage('API key saved successfully! Redirecting to chat...');
      setApiKey('');
      
      // Redirect to main app after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error saving API key:', error);
      setMessage('Error saving API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">API Key Setup</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            Gemini API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleSaveApiKey}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save API Key'}
        </button>
        {message && (
          <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </div>
        )}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Back to Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup; 