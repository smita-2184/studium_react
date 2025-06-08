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

  // ===== UI helpers =====
  // Keep a reference to the chat container so we can auto-scroll to the bottom when messages update
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll whenever messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [qaPairs, currentQA]);

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
      
      // Send request to API
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

      const result = await response.json();

      if (result.success) {
        // Create new Q&A pair
        const newQA: QAPair = {
          id: Date.now().toString(),
          question: result.userTranscript,
          answer: '',
          isComplete: false,
          timestamp: new Date()
        };

        // Show question immediately
        setCurrentQA(newQA);
        onTranscriptUpdate?.(result.userTranscript, true);
        console.log('User transcript updated:', result.userTranscript);

        // Simulate streaming for better UX
        const words = result.aiResponse.split(' ');
        let currentAnswer = '';
        
        for (let i = 0; i < words.length; i++) {
          currentAnswer += words[i] + ' ';
          
          // Update current Q&A with streaming answer
          setCurrentQA(prev => prev ? { ...prev, answer: currentAnswer.trim() } : null);
          onTranscriptUpdate?.(currentAnswer.trim(), false);
          
          // Add small delay between words for streaming effect
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Mark as complete and move to completed pairs
        const completedQA: QAPair = {
          ...newQA,
          answer: result.aiResponse,
          isComplete: true
        };
        
        setQaPairs(prev => [...prev, completedQA]);
        setCurrentQA(null);
        
        // Prefer server-generated audio if provided
        if (result.audioResponse) {
          await playAudioResponse(result.audioResponse);
        } else {
          // Fallback to browser TTS
          speakText(result.aiResponse);
        }
        
        console.log('Response completed:', result.aiResponse);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
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

  // ===== Speech Synthesis (browser TTS) =====
  const speakText = (text: string) => {
    if (isMuted || !text) return;
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage;

    // Try to match a voice based on the selectedVoice label
    const voices = synth.getVoices();
    const match = voices.find((v) => v.name.toLowerCase().includes(selectedVoice.toLowerCase()));
    if (match) {
      utterance.voice = match;
    } else {
      // Fallback to first voice that matches language
      const fallback = voices.find((v) => v.lang === selectedLanguage);
      if (fallback) utterance.voice = fallback;
    }

    synth.speak(utterance);
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
    <div className="relative flex flex-col max-h-[80vh] min-h-[400px] h-full bg-gradient-to-br from-zinc-800 via-zinc-800 to-zinc-900 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Mic className="w-5 h-5" />
          <span>Voice Tutor</span>
        </h3>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2 rounded-full transition hover:scale-105 ${isMuted ? 'bg-red-600' : 'bg-zinc-600'}`}
          title={isMuted ? 'Unmute responses' : 'Mute responses'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Settings */}
      <div className="px-4 pt-4 grid grid-cols-2 gap-4">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as 'en-US' | 'de-DE')}
          className="bg-zinc-700 text-white text-sm px-3 py-2 rounded border border-zinc-600 focus:outline-none"
          disabled={isRecording || isProcessing}
          title="Select language"
        >
          <option value="en-US">🇺🇸 English</option>
          <option value="de-DE">🇩🇪 Deutsch</option>
        </select>
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          className="bg-zinc-700 text-white text-sm px-3 py-2 rounded border border-zinc-600 focus:outline-none"
          disabled={isRecording || isProcessing}
          title="Select AI voice"
        >
          {voiceOptions[selectedLanguage].map((voice) => (
            <option key={voice} value={voice}>
              {voice}
            </option>
          ))}
        </select>
      </div>

      {/* Conversation */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-600"
      >
        {qaPairs.length === 0 && !currentQA && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <Mic size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Hold the mic button to start chatting</p>
          </div>
        )}
        {qaPairs.map((qa) => (
          <div key={qa.id} className="space-y-2">
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs shadow">
                <p className="text-sm">{qa.question}</p>
                <span className="block text-[10px] opacity-70 text-right mt-1">
                  {qa.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
            {/* AI bubble */}
            <div className="flex">
              <div className="bg-zinc-700 text-white rounded-lg px-4 py-2 max-w-xs shadow">
                <p className="text-sm">{qa.answer}</p>
              </div>
            </div>
          </div>
        ))}

        {currentQA && (
          <div className="space-y-2">
            {/* User question (fixed) */}
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs shadow">
                <p className="text-sm">{currentQA.question}</p>
              </div>
            </div>
            {/* AI typing */}
            <div className="flex">
              <div className="bg-zinc-700 text-white rounded-lg px-4 py-2 max-w-xs shadow flex items-center space-x-1">
                <p className="text-sm">{currentQA.answer}</p>
                <span className="animate-pulse">|</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="p-4 border-t border-zinc-700 flex items-center justify-center space-x-4 bg-zinc-800/50 backdrop-blur-sm">
        {isPlaying && (
          <button
            onClick={stopAudio}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-600 hover:bg-orange-700 text-white transition"
            title="Stop audio playback"
          >
            <Square size={18} />
          </button>
        )}

        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition transform hover:scale-105 ${
            isRecording ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
          }`}
          disabled={isProcessing}
          title={isRecording ? 'Release to send' : 'Hold to talk'}
        >
          {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
        </button>

        <button
          onClick={testSimpleAudio}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-700 text-white transition"
          disabled={isProcessing}
          title="Play test beep"
        >
          <Volume2 size={18} />
        </button>

        {isProcessing && (
          <div className="ml-4 flex items-center space-x-2 text-sm text-zinc-400">
            <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
}; 