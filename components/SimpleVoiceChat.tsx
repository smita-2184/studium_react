"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play, Square } from 'lucide-react';

interface QAPair {
  id: string;
  question: string;
  answer: string;
  isComplete: boolean;
  timestamp: Date;
}

interface SimpleVoiceChatProps {
  onTranscriptUpdate?: (transcript: string, isUser: boolean) => void;
}

export const SimpleVoiceChat: React.FC<SimpleVoiceChatProps> = ({ onTranscriptUpdate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [currentQA, setCurrentQA] = useState<QAPair | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'de-DE'>('en-US');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Voice options for different languages
  const voiceOptions = {
    'en-US': ['Kore', 'Puck', 'Aoede', 'Charon', 'Fenrir', 'Leda'],
    'de-DE': ['Kore', 'Orus', 'Zephyr', 'Autonoe', 'Umbriel', 'Erinome']
  };

  // Initialize microphone
  const initializeMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        await processAudio(audioBlob);
      };

      return true;
    } catch (error) {
      console.error('Error initializing microphone:', error);
      return false;
    }
  };

  // Convert audio blob to base64
  const audioToBase64 = (audioBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  };

  // Process recorded audio
  const processAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      // Convert audio to base64
      const base64Audio = await audioToBase64(audioBlob);
      
      // Create EventSource for streaming response
      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64Audio,
          language: selectedLanguage,
          voice: selectedVoice
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response reader available');
      }

      let currentAnswer = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk and split by double newlines (SSE format)
        const chunk = decoder.decode(value);
        const events = chunk.split('\n\n');

        for (const event of events) {
          if (!event.trim() || !event.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(event.slice(5)); // Remove 'data: ' prefix

            // Handle transcription update
            if (data.userTranscript) {
              const newQA: QAPair = {
                id: Date.now().toString(),
                question: data.userTranscript,
                answer: '',
                isComplete: false,
                timestamp: new Date()
              };
              setCurrentQA(newQA);
              onTranscriptUpdate?.(data.userTranscript, true);
              console.log('User transcript updated:', data.userTranscript);
            }

            // Handle AI response streaming
            if (data.aiResponseChunk) {
              currentAnswer += data.aiResponseChunk;
              if (currentQA) {
                setCurrentQA(prev => prev ? { ...prev, answer: currentAnswer } : null);
              }
              onTranscriptUpdate?.(currentAnswer, false);
            }

            // Handle completion
            if (data.done) {
              if (currentQA) {
                const completedQA = { ...currentQA, answer: currentAnswer, isComplete: true };
                setQaPairs(prev => [...prev, completedQA]);
                setCurrentQA(null);
              }
              currentAnswer = '';
              console.log('Streaming completed');
            }

            // Handle errors
            if (data.error) {
              throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }

    } catch (error: any) {
      console.error('Error processing audio:', error);
      if (currentQA) {
        const errorQA = { ...currentQA, answer: `Error: ${error.message}`, isComplete: true };
        setQaPairs(prev => [...prev, errorQA]);
        setCurrentQA(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Play audio response
  const playAudioResponse = async (base64Audio: string) => {
    try {
      console.log('Starting audio playback...');
      console.log('Base64 audio length:', base64Audio.length);
      
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      // Method 1: Try direct data URL approach first (most reliable for TTS)
      const dataUrl = `data:audio/wav;base64,${base64Audio}`;
      console.log('Created data URL, length:', dataUrl.length);
      
      const audio = new Audio(dataUrl);
      currentAudioRef.current = audio;
      
      // Set up event listeners
      audio.onloadstart = () => console.log('Audio loading started');
      audio.oncanplay = () => console.log('Audio can play');
      audio.onloadeddata = () => console.log('Audio data loaded');
      audio.onplay = () => {
        console.log('Audio started playing');
        setIsPlaying(true);
      };
      audio.onended = () => {
        console.log('Audio playback ended');
        setIsPlaying(false);
        currentAudioRef.current = null;
      };
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        console.error('Audio error details:', audio.error);
        setIsPlaying(false);
        currentAudioRef.current = null;
        
        // Try blob approach as fallback
        tryBlobPlayback(base64Audio);
      };
      
      // Set volume and play
      audio.volume = 1.0;
      audio.preload = 'auto';
      
      console.log('Attempting to play audio...');
      await audio.play();
      
    } catch (error: any) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      
      // Try blob approach as fallback
      tryBlobPlayback(base64Audio);
    }
  };

  // Alternative blob-based audio playback method
  const tryBlobPlayback = async (base64Audio: string) => {
    try {
      console.log('Trying blob playback...');
      
      // Create audio blob from base64
      const binaryString = atob(base64Audio);
      const audioArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioArray[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onplay = () => {
        console.log('Blob audio started playing');
        setIsPlaying(true);
      };
      audio.onended = () => {
        console.log('Blob audio playback ended');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      audio.onerror = (e) => {
        console.error('Blob audio error:', e);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        
        // Try with different MIME type
        tryAlternativeFormat(base64Audio);
      };
      
      await audio.play();
      
    } catch (error: any) {
      console.error('Blob playback failed:', error);
      setIsPlaying(false);
      tryAlternativeFormat(base64Audio);
    }
  };

  // Try alternative audio formats
  const tryAlternativeFormat = async (base64Audio: string) => {
    try {
      console.log('Trying alternative audio format...');
      
      // Try as MP3
      const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;
      const audio = new Audio(dataUrl);
      currentAudioRef.current = audio;
      
      audio.onplay = () => {
        console.log('Alternative format audio started playing');
        setIsPlaying(true);
      };
      audio.onended = () => {
        console.log('Alternative format audio playback ended');
        setIsPlaying(false);
        currentAudioRef.current = null;
      };
      audio.onerror = (e) => {
        console.error('All audio playback methods failed:', e);
        setIsPlaying(false);
        currentAudioRef.current = null;
      };
      
      await audio.play();
      
    } catch (error: any) {
      console.error('Alternative format playback failed:', error);
      setIsPlaying(false);
    }
  };

  // Test audio function
  const testAudio = async () => {
    try {
      setIsProcessing(true);
      console.log('Testing audio with sample text...');
      
      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: '', // Empty audio data for text-only test
          language: selectedLanguage,
          voice: selectedVoice,
          testMode: true,
          testText: 'Hello! This is a test of the audio system. Can you hear me clearly?'
        }),
      });

      const result = await response.json();
      console.log('Test audio result:', result);
      
      if (result.success && result.audioResponse) {
        console.log('Playing test audio...');
        await playAudioResponse(result.audioResponse);
      } else {
        console.error('Test audio failed:', result.error);
      }
    } catch (error: any) {
      console.error('Error testing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simple audio test without API
  const testSimpleAudio = async () => {
    try {
      console.log('Testing simple audio beep...');
      
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // 800 Hz beep
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('Simple beep should be playing...');
      
    } catch (error: any) {
      console.error('Error testing simple audio:', error);
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!mediaRecorderRef.current) {
      const initialized = await initializeMicrophone();
      if (!initialized) return;
    }

    try {
      audioChunksRef.current = [];
      mediaRecorderRef.current?.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Stop audio playback
  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsPlaying(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Voice Chat</h3>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2 rounded ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-600 hover:bg-zinc-700'} text-white`}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Language and Voice Selection */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm text-zinc-300 mb-1">Language</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as 'en-US' | 'de-DE')}
            className="w-full bg-zinc-700 text-white text-sm px-3 py-2 rounded border border-zinc-600"
            disabled={isRecording || isProcessing}
          >
            <option value="en-US">🇺🇸 English</option>
            <option value="de-DE">🇩🇪 Deutsch</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm text-zinc-300 mb-1">Voice</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full bg-zinc-700 text-white text-sm px-3 py-2 rounded border border-zinc-600"
            disabled={isRecording || isProcessing}
          >
            {voiceOptions[selectedLanguage].map(voice => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`flex items-center space-x-2 px-6 py-3 rounded-full ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium`}
          disabled={isProcessing}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          <span>
            {isProcessing ? 'Processing...' : isRecording ? 'Release to Stop' : 'Hold to Talk'}
          </span>
        </button>

        {isPlaying && (
          <button
            onClick={stopAudio}
            className="flex items-center space-x-2 px-4 py-2 rounded bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Square size={16} />
            <span>Stop Audio</span>
          </button>
        )}

        <button
          onClick={testAudio}
          className="flex items-center space-x-2 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm"
          disabled={isProcessing}
        >
          <Play size={16} />
          <span>Test Audio</span>
        </button>

        <button
          onClick={testSimpleAudio}
          className="flex items-center space-x-2 px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-xs"
          disabled={isProcessing}
        >
          <Volume2 size={14} />
          <span>Test Beep</span>
        </button>
      </div>

      {/* Status */}
      <div className="text-center text-sm text-zinc-400">
        {isProcessing && (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span>Processing your voice...</span>
          </div>
        )}
        {isPlaying && (
          <div className="flex items-center justify-center space-x-2">
            <Play size={16} className="text-green-400" />
            <span className="text-green-400">Playing AI response...</span>
          </div>
        )}
        {!isProcessing && !isPlaying && !isRecording && (
          <div className="text-zinc-500">
            Ready to chat • Click "Test Beep" to check audio • Hold mic to record
          </div>
        )}
      </div>

      {/* Q&A Pairs Display */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {/* Previous completed Q&A pairs */}
        {qaPairs.map(qa => (
          <div key={qa.id} className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-blue-400">You asked:</span>
              </div>
              <div className="bg-zinc-800 rounded p-3 ml-4">
                <p className="text-sm text-zinc-200">{qa.question}</p>
              </div>
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-green-400">AI answered:</span>
              </div>
              <div className="bg-zinc-800 rounded p-3 ml-4">
                <p className="text-sm text-zinc-200">{qa.answer}</p>
              </div>
            </div>
            
            <div className="text-xs text-zinc-500 mt-2 text-right">
              {qa.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}

        {/* Current ongoing Q&A */}
        {currentQA && (
          <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-600 border-dashed">
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-blue-400">You asked:</span>
              </div>
              <div className="bg-zinc-800 rounded p-3 ml-4">
                <p className="text-sm text-zinc-200">{currentQA.question}</p>
              </div>
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium text-orange-400">AI is responding:</span>
              </div>
              <div className="bg-zinc-800 rounded p-3 ml-4">
                <p className="text-sm text-zinc-200">
                  {currentQA.answer}
                  <span className="animate-pulse">|</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {qaPairs.length === 0 && !currentQA && (
          <div className="bg-zinc-900 rounded-lg p-6 text-center border border-zinc-700 border-dashed">
            <div className="text-zinc-500 mb-2">
              <Mic size={24} className="mx-auto mb-2 opacity-50" />
            </div>
            <p className="text-sm text-zinc-400">No conversations yet</p>
            <p className="text-xs text-zinc-500 mt-1">Hold the microphone button to start chatting</p>
          </div>
        )}
      </div>

      <div className="text-xs text-zinc-500">
        <p>• Select language and voice before speaking</p>
        <p>• Hold the microphone button to record</p>
        <p>• AI will respond with voice automatically</p>
        <p>• Use mute button to disable audio responses</p>
      </div>
    </div>
  );
}; 