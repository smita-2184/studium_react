import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const TestAuth = () => {
  const [status, setStatus] = useState('Initializing...');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setStatus('User authenticated');
        setError('');
      } else {
        setStatus('No user, attempting anonymous sign-in...');
        signInAnonymously(auth)
          .then((result) => {
            setUser(result.user);
            setStatus('Anonymous sign-in successful');
            setError('');
          })
          .catch((error) => {
            setError(`Authentication failed: ${error.code} - ${error.message}`);
            setStatus('Authentication failed');
          });
      }
    });

    return () => unsubscribe();
  }, []);

  const testSignIn = async () => {
    setStatus('Testing sign-in...');
    setError('');
    try {
      const result = await signInAnonymously(auth);
      setUser(result.user);
      setStatus('Manual sign-in successful');
    } catch (error: any) {
      setError(`Manual sign-in failed: ${error.code} - ${error.message}`);
      setStatus('Manual sign-in failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">Authentication Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
          <div>
            <strong>Status:</strong> {status}
          </div>
          
          {error && (
            <div className="text-red-600">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {user && (
            <div className="text-green-600">
              <strong>User ID:</strong> {user.uid}
              <br />
              <strong>Anonymous:</strong> {user.isAnonymous ? 'Yes' : 'No'}
            </div>
          )}
          
          <button
            onClick={testSignIn}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Test Manual Sign-In
          </button>
          
          <div className="mt-4">
            <a href="/" className="text-blue-600 hover:underline">
              Back to Main App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAuth; 