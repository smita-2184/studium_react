import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp?: any;
  imageData?: string;
}

interface ChatProps {
  userId?: string;
  imageAnalysis?: string;
}

const Chat: React.FC<ChatProps> = ({ userId = 'anonymous' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(true);
  const [error, setError] = useState<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const genAI = useRef<GoogleGenerativeAI | null>(null);
  const modelRef = useRef<any>(null);

  // Fetch API key from Firestore
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        console.log('Fetching API key from Firestore...');
        const apiKeyDoc = await getDoc(doc(db, 'api_keys', 'gemini'));
        if (apiKeyDoc.exists()) {
          const data = apiKeyDoc.data();
          console.log('API key document data:', data);
          const key = data.key || data.gemini;
          if (key) {
            console.log('API key found, initializing Gemini with gemini-2.0-flash model...');
            setApiKey(key);
            genAI.current = new GoogleGenerativeAI(key);
            modelRef.current = genAI.current.getGenerativeModel({ model: "gemini-2.0-flash" });
            console.log('Gemini 2.0 Flash initialized successfully');
          } else {
            console.error('API key not found in document fields:', Object.keys(data));
            setError('API key not found in Firestore document');
          }
        } else {
          console.error('API key document does not exist');
          setError('API key document not found in Firestore');
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
        setError(`Error fetching API key: ${error}`);
      } finally {
        setIsLoadingApiKey(false);
      }
    };

    fetchApiKey();
  }, []);

  // Subscribe to messages from Firestore
  useEffect(() => {
    const messagesRef = collection(db, 'chats', userId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
          role: data.role,
          content: data.content,
          timestamp: data.timestamp
        });
      });
      setMessages(newMessages);
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    return () => unsubscribe();
  }, [userId]);

  const saveMessage = async (message: Message) => {
    try {
      const messagesRef = collection(db, 'chats', userId, 'messages');
      await addDoc(messagesRef, {
        ...message,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !modelRef.current) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setInput('');
    setIsLoading(true);
    setError(''); // Clear any previous errors

    try {
      console.log('Sending user message:', userMessage.content);
      
      // Save user message
      await saveMessage(userMessage);
      console.log('User message saved to Firestore');

      // Create a new chat session with current history
      console.log('Creating chat session with history length:', messages.length);
      const chat = modelRef.current.startChat({
        history: messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });

      console.log('Sending message to Gemini 2.0 Flash API...');
      // Get AI response
      const result = await chat.sendMessage(userMessage.content);
      console.log('Received response from Gemini 2.0 Flash API');
      
      const response = result.response;
      const responseText = response.text();
      console.log('Response text:', responseText);
      
      const modelMessage: Message = {
        role: 'model',
        content: responseText,
      };

      // Save AI response
      await saveMessage(modelMessage);
      console.log('AI response saved to Firestore');
    } catch (error: any) {
      console.error('Error in chat interaction:', error);
      
      // Show error to user
      let errorMessage = 'Failed to get response from AI';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      if (error.status) {
        errorMessage += ` (Status: ${error.status})`;
      }
      
      setError(errorMessage);
      
      // Save error message for user to see
      const errorMsg: Message = {
        role: 'model',
        content: `❌ Error: ${errorMessage}. Please check your API key and try again.`,
      };
      
      try {
        await saveMessage(errorMsg);
      } catch (saveError) {
        console.error('Error saving error message:', saveError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoadingApiKey) {
    return (
      <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border rounded-lg shadow-lg bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading API configuration...</div>
        </div>
      </div>
    );
  }

  if (!apiKey || error) {
    return (
      <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border rounded-lg shadow-lg bg-white">
        <div className="flex-1 flex items-center justify-center flex-col space-y-4">
          <div className="text-red-500 text-center">
            {error || 'API key not configured'}
          </div>
          <a 
            href="/admin" 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Set up API Key
          </a>
          <div className="text-xs text-gray-500 text-center max-w-md">
            Make sure your Gemini API key is saved in Firestore under: api_keys/gemini with field name "gemini"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border rounded-lg shadow-lg bg-white">
      <div className="bg-green-50 border-b px-4 py-2">
        <div className="text-sm text-green-700">
          ✅ Chat is ready! Using Gemini 2.0 Flash model.
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border-b px-4 py-2">
          <div className="text-sm text-red-700">
            ❌ {error}
          </div>
        </div>
      )}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-lg mb-2">Welcome to Math Studium Chat! 🎓</div>
            <div className="text-sm">Ask me anything about mathematics, science, or any topic you'd like to learn about.</div>
            <div className="text-xs mt-2 text-blue-600">Powered by Gemini 2.0 Flash</div>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.content.startsWith('❌')
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-200 text-black'
              }`}
            >
              {message.imageData && (
                <div className="mb-2">
                  <img 
                    src={`data:image/jpeg;base64,${message.imageData}`}
                    alt="Canvas drawing"
                    className="max-w-full h-auto rounded border"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-black rounded-lg p-3 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
      </div>
      <div className="border-t p-4 bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat; 