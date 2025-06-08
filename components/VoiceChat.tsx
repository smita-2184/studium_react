"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';

interface VoiceChatProps {
  onTranscriptUpdate?: (transcript: string, isUser: boolean) => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ onTranscriptUpdate }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [transcript, setTranscript] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAiResponse, setCurrentAiResponse] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'de-DE'>('en-US');
  const [languageWarning, setLanguageWarning] = useState<string>('');

  const sessionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Filter text to only allow target language characters
  const filterLanguage = (text: string, language: 'en-US' | 'de-DE'): string => {
    const originalLength = text.length;
    let filtered = '';
    
    if (language === 'en-US') {
      // Allow English letters, numbers, punctuation, and common symbols
      filtered = text.replace(/[^\x00-\x7F\u00C0-\u017F]/g, '').trim();
    } else if (language === 'de-DE') {
      // Allow German letters (including umlauts), numbers, punctuation
      filtered = text.replace(/[^\x00-\x7F\u00C0-\u017F\u1E00-\u1EFF]/g, '').trim();
    } else {
      filtered = text;
    }
    
    // Show warning if non-target language was detected and filtered
    if (originalLength > 0 && filtered.length < originalLength * 0.5) {
      const langName = language === 'en-US' ? 'English' : 'German';
      setLanguageWarning(`⚠️ Non-${langName} text detected and filtered. Please speak in ${langName}.`);
      setTimeout(() => setLanguageWarning(''), 5000);
    }
    
    return filtered;
  };

  // Initialize audio context and media recorder
  const initializeAudio = async () => {
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
      
      // Create audio context for processing
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });

      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      return true;
    } catch (error) {
      console.error('Error initializing audio:', error);
      setConnectionStatus('Microphone access denied');
      return false;
    }
  };

  // Convert audio blob to PCM format for Gemini
  const convertToPCM = async (audioBlob: Blob): Promise<string> => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to 16-bit PCM
      const pcmData = audioBuffer.getChannelData(0);
      const pcm16 = new Int16Array(pcmData.length);
      
      for (let i = 0; i < pcmData.length; i++) {
        pcm16[i] = Math.max(-32768, Math.min(32767, pcmData[i] * 32768));
      }
      
      // Convert to base64 using browser APIs
      const uint8Array = new Uint8Array(pcm16.buffer);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return btoa(binary);
    } catch (error) {
      console.error('Error converting audio to PCM:', error);
      throw error;
    }
  };

  // Connect to Gemini Live API
  const connectToGemini = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus('Connecting...');

      // Dynamic import to avoid SSR issues
      const { GoogleGenAI, Modality } = await import('@google/genai');
      
      const response = await fetch('/api/get-gemini-key');
      const { apiKey } = await response.json();
      
      if (!apiKey) {
        throw new Error('Gemini API key not found');
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = 'gemini-2.0-flash-live-001';
      
      const languageInstructions = {
        'en-US': "You are a helpful math tutor assistant. CRITICAL: You must ONLY respond in English language. Never use any other language including Thai, Japanese, Chinese, or any non-English text. If you detect non-English input, politely ask the user to speak in English. Provide clear, concise explanations and be encouraging to students learning mathematics. Always respond in complete English sentences.",
        'de-DE': "Du bist ein hilfreicher Mathe-Tutor. WICHTIG: Du musst NUR auf Deutsch antworten. Verwende niemals andere Sprachen wie Thai, Japanisch, Chinesisch oder andere nicht-deutsche Texte. Wenn du nicht-deutsche Eingaben erkennst, bitte den Benutzer höflich, auf Deutsch zu sprechen. Gib klare, prägnante Erklärungen und ermutige Schüler beim Mathematiklernen."
      };

      // Select appropriate voice for language
      const voiceNames = {
        'en-US': "Aoede", // English voice
        'de-DE': "Kore"   // Better for German
      };

      const config = {
        responseModalities: [Modality.AUDIO],
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { voiceName: voiceNames[selectedLanguage] } 
          }
        },
        systemInstruction: languageInstructions[selectedLanguage]
      };

      const session = await ai.live.connect({
        model: model,
        config: config,
        callbacks: {
          onopen: () => {
            console.log('Connected to Gemini Live API');
            setConnectionStatus('Connected');
            setIsConnected(true);
            setIsLoading(false);
          },
                     onmessage: (message: any) => {
             console.log('Received message:', message);
             console.log('Message type:', typeof message);
             console.log('Message keys:', Object.keys(message));
             
             // Handle transcriptions
             if (message.serverContent?.inputTranscription?.text) {
               const userTranscript = message.serverContent.inputTranscription.text;
               console.log('User transcript:', userTranscript);
               
               // Filter out non-target language characters
               const filteredTranscript = filterLanguage(userTranscript, selectedLanguage);
               
               if (filteredTranscript.trim()) {
                 setTranscript(prev => prev + `You: ${filteredTranscript}\n`);
                 onTranscriptUpdate?.(filteredTranscript, true);
               }
             }
             
             if (message.serverContent?.outputTranscription?.text) {
               const aiTranscript = message.serverContent.outputTranscription.text;
               console.log('AI transcript:', aiTranscript);
               
               // Filter AI response to target language
               const filteredAiTranscript = filterLanguage(aiTranscript, selectedLanguage);
               
               // Check if this is a complete response or partial
               if (message.serverContent?.turnComplete) {
                 // Complete response - add to transcript
                 const fullResponse = currentAiResponse + filteredAiTranscript;
                 if (fullResponse.trim()) {
                   setTranscript(prev => prev + `AI: ${fullResponse}\n`);
                   onTranscriptUpdate?.(fullResponse, false);
                 }
                 setCurrentAiResponse(''); // Reset for next response
               } else {
                 // Partial response - accumulate
                 setCurrentAiResponse(prev => prev + filteredAiTranscript);
               }
             }

             // Handle audio response - check for audio data (only play once)
             let audioFound = false;
             
             if (message.data && !audioFound) {
               console.log('Found audio data in message.data');
               playAudioResponse(message.data);
               audioFound = true;
             } 
             
             if (!audioFound && message.serverContent?.modelTurn?.parts) {
               // Check for audio in model turn parts
               for (const part of message.serverContent.modelTurn.parts) {
                 if (part.inlineData?.data && !audioFound) {
                   console.log('Found audio data in modelTurn parts');
                   playAudioResponse(part.inlineData.data);
                   audioFound = true;
                   break; // Only play the first audio found
                 }
               }
             }
             
             if (!audioFound && message.serverContent?.audio?.data) {
               console.log('Found audio data in serverContent.audio');
               playAudioResponse(message.serverContent.audio.data);
               audioFound = true;
             }
             
             if (!audioFound) {
               console.log('No audio data found in message');
             }
           },
          onerror: (error: any) => {
            console.error('Gemini Live API error:', error);
            setConnectionStatus(`Error: ${error.message}`);
            setIsConnected(false);
            setIsLoading(false);
          },
          onclose: (event: any) => {
            console.log('Connection closed:', event.reason);
            setConnectionStatus('Disconnected');
            setIsConnected(false);
            setIsLoading(false);
          }
        }
      });

      sessionRef.current = session;
      
    } catch (error) {
      console.error('Error connecting to Gemini:', error);
      setConnectionStatus(`Connection failed: ${error}`);
      setIsConnected(false);
      setIsLoading(false);
    }
  };

  // Play audio response from Gemini
  const playAudioResponse = async (base64Audio: string) => {
    try {
      if (isMuted) return;

      // Stop any currently playing audio
      if (currentAudioSourceRef.current) {
        try {
          currentAudioSourceRef.current.stop();
          currentAudioSourceRef.current.disconnect();
        } catch (e) {
          // Audio might already be stopped
        }
        currentAudioSourceRef.current = null;
      }

      // Convert base64 PCM to audio buffer
      const binaryString = atob(base64Audio);
      const bytes = new Int16Array(binaryString.length / 2);
      
      // Convert binary string to Int16Array (PCM data)
      for (let i = 0; i < bytes.length; i++) {
        const byte1 = binaryString.charCodeAt(i * 2);
        const byte2 = binaryString.charCodeAt(i * 2 + 1);
        bytes[i] = (byte2 << 8) | byte1; // Little-endian
      }

      // Create audio context and buffer
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const audioBuffer = audioContext.createBuffer(1, bytes.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert Int16 to Float32 for Web Audio API
      for (let i = 0; i < bytes.length; i++) {
        channelData[i] = bytes[i] / 32768.0;
      }

      // Play the audio
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      // Store reference to current audio source
      currentAudioSourceRef.current = source;
      
      // Clean up reference when audio ends
      source.onended = () => {
        if (currentAudioSourceRef.current === source) {
          currentAudioSourceRef.current = null;
        }
      };
      
      source.start();
      console.log('Playing audio response');
      
    } catch (error) {
      console.error('Error playing audio response:', error);
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!sessionRef.current || !mediaRecorderRef.current) return;

    try {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start(500); // Collect data more frequently
      setIsRecording(true);
      setConnectionStatus('Recording...');
      
      console.log('Started recording audio');

      // Send audio chunks periodically
      const sendAudioInterval = setInterval(async () => {
        if (audioChunksRef.current.length > 0 && sessionRef.current) {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            console.log('Converting audio blob, size:', audioBlob.size);
            
            const pcmData = await convertToPCM(audioBlob);
            console.log('Converted to PCM, length:', pcmData.length);
            
            // Send audio using the primary method only
            sessionRef.current.sendRealtimeInput({
              audio: {
                data: pcmData,
                mimeType: "audio/pcm;rate=16000"
              }
            });
            
            console.log('Sent audio chunk to Gemini');
            audioChunksRef.current = [];
          } catch (error) {
            console.error('Error sending audio:', error);
          }
        }
      }, 500); // Send more frequently

      // Store interval reference for cleanup
      (mediaRecorderRef.current as any).sendInterval = sendAudioInterval;
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setConnectionStatus('Recording failed');
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setConnectionStatus('Processing...');
      
      console.log('Stopped recording');

      // Clear sending interval
      if ((mediaRecorderRef.current as any).sendInterval) {
        clearInterval((mediaRecorderRef.current as any).sendInterval);
      }

      // Send any remaining audio chunks
      if (audioChunksRef.current.length > 0 && sessionRef.current) {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const pcmData = await convertToPCM(audioBlob);
          
          sessionRef.current.sendRealtimeInput({
            audio: {
              data: pcmData,
              mimeType: "audio/pcm;rate=16000"
            }
          });
          
          console.log('Sent final audio chunk');
          audioChunksRef.current = [];
        } catch (error) {
          console.error('Error sending final audio:', error);
        }
      }

      // Send end of audio stream
      if (sessionRef.current) {
        sessionRef.current.sendRealtimeInput({ audioStreamEnd: true });
        console.log('Sent audio stream end signal');
        
        // Also try sending a text prompt to trigger response
        setTimeout(() => {
          if (sessionRef.current) {
            sessionRef.current.sendClientContent({ 
              turns: [{ 
                role: "user", 
                parts: [{ text: "Please respond to my audio message." }] 
              }],
              turnComplete: true 
            });
            console.log('Sent text prompt to trigger response');
          }
        }, 1000);
      }
      
      setConnectionStatus('Connected');
    }
  };

  // Disconnect from Gemini
  const disconnect = () => {
    // Stop any playing audio
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current.disconnect();
      } catch (e) {
        // Audio might already be stopped
      }
      currentAudioSourceRef.current = null;
    }

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
    setIsRecording(false);
    setConnectionStatus('Disconnected');
    setCurrentAiResponse('');
    setTranscript('');
  };

  // Handle connect/disconnect
  const handleConnection = async () => {
    if (isConnected) {
      disconnect();
    } else {
      const audioInitialized = await initializeAudio();
      if (audioInitialized) {
        await connectToGemini();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Voice Chat</h3>
        <div className="flex items-center space-x-2">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as 'en-US' | 'de-DE')}
            className="bg-zinc-700 text-white text-sm px-2 py-1 rounded border border-zinc-600"
            disabled={isConnected}
          >
            <option value="en-US">🇺🇸 English</option>
            <option value="de-DE">🇩🇪 Deutsch</option>
          </select>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-600 hover:bg-zinc-700'} text-white`}
            disabled={!isConnected}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={handleConnection}
            className={`flex items-center space-x-2 px-4 py-2 rounded ${
              isConnected 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : isConnected ? (
              <>
                <PhoneOff size={16} />
                <span>Disconnect</span>
              </>
            ) : (
              <>
                <Phone size={16} />
                <span>Connect</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="text-sm text-zinc-400">
        Status: <span className={`${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          {connectionStatus}
        </span>
      </div>

      {languageWarning && (
        <div className="bg-yellow-900 border border-yellow-600 text-yellow-200 px-3 py-2 rounded text-sm">
          {languageWarning}
        </div>
      )}

      {isConnected && (
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-4">
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
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              <span>{isRecording ? 'Release to Stop' : 'Hold to Talk'}</span>
            </button>
          </div>
          
          <button
            onClick={() => {
              if (sessionRef.current) {
                console.log('Sending test message');
                sessionRef.current.sendClientContent({
                  turns: [{
                    role: "user",
                    parts: [{ text: "Hello, can you hear me? Please respond with audio." }]
                  }],
                  turnComplete: true
                });
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
          >
            Test Audio Response
          </button>
        </div>
      )}

      {transcript && (
        <div className="bg-zinc-900 rounded p-3 max-h-40 overflow-y-auto">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">Conversation:</h4>
          <pre className="text-xs text-zinc-400 whitespace-pre-wrap">{transcript}</pre>
        </div>
      )}

      <div className="text-xs text-zinc-500">
        <p>• Select language before connecting (English/German only)</p>
        <p>• Hold the microphone button to speak</p>
        <p>• AI responses will be played automatically</p>
        <p>• Conversation transcript appears above</p>
      </div>
    </div>
  );
}; 