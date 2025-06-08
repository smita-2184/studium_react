import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const TestGemini = () => {
  const [apiKey, setApiKey] = useState('');
  const [testMessage, setTestMessage] = useState('Hello, can you tell me about mathematics?');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        addLog('Fetching API key from Firestore...');
        const apiKeyDoc = await getDoc(doc(db, 'api_keys', 'gemini'));
        if (apiKeyDoc.exists()) {
          const data = apiKeyDoc.data();
          addLog(`API key document found with fields: ${Object.keys(data).join(', ')}`);
          const key = data.key || data.gemini;
          if (key) {
            setApiKey(key);
            addLog('API key loaded successfully');
          } else {
            addLog('No API key found in document fields');
            setError('API key not found in Firestore document');
          }
        } else {
          addLog('API key document does not exist');
          setError('API key document not found');
        }
      } catch (error) {
        addLog(`Error fetching API key: ${error}`);
        setError(`Error fetching API key: ${error}`);
      }
    };

    fetchApiKey();
  }, []);

  const testGeminiAPI = async () => {
    if (!apiKey) {
      setError('No API key available');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');
    setLogs([]);

    try {
      addLog('Initializing Google Generative AI...');
      const genAI = new GoogleGenerativeAI(apiKey);
      
      addLog('Getting Gemini 2.0 Flash model...');
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      addLog('Starting chat session...');
      const chat = model.startChat({
        history: [],
      });

      addLog(`Sending message: "${testMessage}"`);
      const result = await chat.sendMessage(testMessage);
      
      addLog('Received response from Gemini 2.0 Flash');
      const responseText = result.response.text();
      addLog(`Response length: ${responseText.length} characters`);
      
      setResponse(responseText);
      addLog('Test completed successfully!');
    } catch (error: any) {
      addLog(`Error occurred: ${error.message || error}`);
      setError(`API Error: ${error.message || error}`);
      
      if (error.status) {
        addLog(`HTTP Status: ${error.status}`);
      }
      if (error.code) {
        addLog(`Error Code: ${error.code}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectAPI = async () => {
    const testKey = prompt('Enter your Gemini API key to test directly:');
    if (!testKey) return;

    setIsLoading(true);
    setError('');
    setResponse('');
    setLogs([]);

    try {
      addLog('Testing with direct API key...');
      const genAI = new GoogleGenerativeAI(testKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      addLog('Sending test message to Gemini 2.0 Flash...');
      const result = await model.generateContent(testMessage);
      const responseText = result.response.text();
      
      setResponse(responseText);
      addLog('Direct API test successful!');
    } catch (error: any) {
      addLog(`Direct API test failed: ${error.message || error}`);
      setError(`Direct API Error: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Gemini 2.0 Flash API Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Key Status:</label>
                <div className={`text-sm ${apiKey ? 'text-green-600' : 'text-red-600'}`}>
                  {apiKey ? '✅ API Key Loaded' : '❌ No API Key'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model:</label>
                <div className="text-sm text-blue-600 font-mono">gemini-2.0-flash</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Test Message:</label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 h-20"
                  placeholder="Enter test message..."
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={testGeminiAPI}
                  disabled={isLoading || !apiKey}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? 'Testing...' : 'Test Firestore API Key'}
                </button>
                
                <button
                  onClick={testDirectAPI}
                  disabled={isLoading}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  Test Direct API Key
                </button>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Response */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Response</h2>
            <div className="border rounded-lg p-3 h-64 overflow-y-auto bg-gray-50">
              {response ? (
                <div className="whitespace-pre-wrap">{response}</div>
              ) : (
                <div className="text-gray-500 italic">No response yet...</div>
              )}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Debug Logs</h2>
          <div className="border rounded-lg p-3 h-48 overflow-y-auto bg-gray-900 text-green-400 font-mono text-sm">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            ) : (
              <div className="text-gray-500">No logs yet...</div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:underline">
            Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestGemini; 