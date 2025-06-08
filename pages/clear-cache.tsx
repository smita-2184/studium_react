import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const ClearCache = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const clearChatHistory = async () => {
    if (!user) {
      setMessage('No user authenticated');
      return;
    }

    setIsClearing(true);
    try {
      const messagesRef = collection(db, 'chats', user.uid, 'messages');
      const snapshot = await getDocs(messagesRef);
      
      const deletePromises = snapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'chats', user.uid, 'messages', docSnapshot.id))
      );
      
      await Promise.all(deletePromises);
      setMessage(`Cleared ${snapshot.docs.length} messages from chat history`);
    } catch (error) {
      setMessage(`Error clearing chat history: ${error}`);
    } finally {
      setIsClearing(false);
    }
  };

  const signInAnonymous = async () => {
    try {
      await signInAnonymously(auth);
      setMessage('Signed in anonymously');
    } catch (error) {
      setMessage(`Error signing in: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">Clear Cache & Reset</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-4">User Status</h2>
            <div className={`text-sm ${user ? 'text-green-600' : 'text-red-600'}`}>
              {user ? `✅ Authenticated: ${user.uid}` : '❌ Not authenticated'}
            </div>
          </div>

          <div className="space-y-2">
            {!user && (
              <button
                onClick={signInAnonymous}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
              >
                Sign In Anonymously
              </button>
            )}
            
            <button
              onClick={clearChatHistory}
              disabled={isClearing || !user}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              {isClearing ? 'Clearing...' : 'Clear Chat History'}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>

          {message && (
            <div className={`text-sm p-3 rounded ${
              message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {message}
            </div>
          )}

          <div className="text-center space-x-4">
            <a href="/" className="text-blue-600 hover:underline">
              Back to Chat
            </a>
            <a href="/test-gemini" className="text-purple-600 hover:underline">
              Test Gemini
            </a>
          </div>
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Clear your browser cache (Ctrl+Shift+Delete)</li>
            <li>Clear chat history using the button above</li>
            <li>Test the API directly on the Test Gemini page</li>
            <li>Check that your API key is correctly saved in Firestore</li>
            <li>Ensure you're using a valid Gemini API key</li>
            <li>Verify the API key has proper permissions</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ClearCache; 