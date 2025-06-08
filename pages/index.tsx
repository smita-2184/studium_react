import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import Chat from '../components/Chat';
import { PdfViewer } from '../components/PdfViewer';
import { PdfUploader } from '../components/PdfUploader';
import { LaTeXRenderer } from '../components/LaTeXRenderer';
import { SimpleLatexRenderer } from '../components/SimpleLatexRenderer';
import { GeoGebraGraph } from '../components/GeoGebraGraph';
import { SimpleGeoGebraGraph } from '../components/SimpleGeoGebraGraph';
import { EmbeddedGeoGebra } from '../components/EmbeddedGeoGebra';
import { SimpleVoiceChat } from '../components/SimpleVoiceChat';
import { useWindowDimensions } from '../hooks/useWindowDimensions';
import dynamic from 'next/dynamic';

// Dynamically import CanvasOverlay to avoid SSR issues
const CanvasOverlay = dynamic(() => import('../components/CanvasOverlay').then(mod => ({ default: mod.CanvasOverlay })), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-transparent" />
});
import Link from 'next/link';
import Image from "next/image";
import {
  Plus,
  GraduationCap,
  ChevronDown,
  PanelLeftOpen,
  Search,
  Sun,
  RotateCcw,
  Download,
  Printer,
  Maximize,
  ChevronLeft,
  MessageCircle,
  Copy,
  ClipboardCheck,
  AlignLeft,
  Bot,
  HelpCircle,
  Share2,
  Mic,
  TrendingUp,
  Sparkles,
  AtSign,
  Camera,
  Voicemail,
  Globe,
  Palette,
  FileText,
  Eraser,
  Calculator,
  BarChart3,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string>('');
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'flashcards' | 'quizzes' | 'summary' | 'equations' | 'graphs'>('chat');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [extractedEquations, setExtractedEquations] = useState<string[]>([]);
  const [geogebraGraphs, setGeogebraGraphs] = useState<{equation: string, geogebraEquation: string}[]>([]);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    let mounted = true;

    // Handle auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (user) {
        setUser(user);
        setAuthError('');
        setIsLoading(false);
      } else {
        // Try to sign in anonymously if no user
        try {
          const result = await signInAnonymously(auth);
          if (mounted) {
            setUser(result.user);
            setAuthError('');
            setIsLoading(false);
          }
        } catch (error: any) {
          console.error('Error signing in anonymously:', error);
          if (mounted) {
            setAuthError(error.message || 'Authentication failed');
            setIsLoading(false);
          }
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const retryAuth = async () => {
    setIsLoading(true);
    setAuthError('');
    try {
      const result = await signInAnonymously(auth);
      setUser(result.user);
    } catch (error: any) {
      console.error('Error retrying authentication:', error);
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfSelect = (file: File) => {
    setSelectedPdf(file);
  };

  const handleTransferToChat = async (imageData: string) => {
    try {
      // Switch to chat tab and show loading state
      setActiveTab('chat');
      
      // Show a temporary notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = '🎨 Transferring canvas to chat...';
      document.body.appendChild(notification);
      
      // Send image to API for analysis
      const response = await fetch('/api/analyze-canvas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          prompt: "Analyze this drawing and explain what you see. If it contains mathematical content, help solve or explain it."
        }),
      });

      const result = await response.json();
      
      // Remove notification
      document.body.removeChild(notification);
      
      if (result.success) {
        // Show success notification
        const successNotification = document.createElement('div');
        successNotification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successNotification.textContent = '✅ Canvas analysis ready in chat!';
        document.body.appendChild(successNotification);
        
        setTimeout(() => {
          if (document.body.contains(successNotification)) {
            document.body.removeChild(successNotification);
          }
        }, 3000);
        
        // Send the analysis to the chat by creating messages
        if (user && result.analysis) {
          try {
            const { db } = await import('../lib/firebase');
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            
            // First, add a user message showing the canvas was transferred
            await addDoc(collection(db, 'chats', user.uid, 'messages'), {
              role: 'user',
              content: `🎨 I've shared my canvas drawing for analysis. Please analyze what I've drawn.`,
              imageData: imageData,
              timestamp: serverTimestamp()
            });
            
            // Then add the AI analysis as a response
            await addDoc(collection(db, 'chats', user.uid, 'messages'), {
              role: 'model',
              content: `🎨 **Canvas Analysis:**\n\n${result.analysis}`,
              timestamp: serverTimestamp()
            });
            
            console.log('Canvas analysis added to chat');
          } catch (error) {
            console.error('Error adding analysis to chat:', error);
          }
        }
        
        console.log('Canvas transferred to chat successfully:', result);
      } else {
        console.error('Failed to analyze canvas:', result.error);
        
        // Show error notification
        const errorNotification = document.createElement('div');
        errorNotification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        errorNotification.textContent = '❌ Failed to analyze canvas';
        document.body.appendChild(errorNotification);
        
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error transferring canvas to chat:', error);
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorNotification.textContent = '❌ Error transferring canvas';
      document.body.appendChild(errorNotification);
      
      setTimeout(() => {
        if (document.body.contains(errorNotification)) {
          document.body.removeChild(errorNotification);
        }
      }, 3000);
    }
  };

  const handleTransferEquation = async (imageData: string) => {
    try {
      // Show a temporary notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = '🔢 Extracting equations...';
      document.body.appendChild(notification);
      
      // Send image to API for equation extraction
      const response = await fetch('/api/extract-equation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData
        }),
      });

      const result = await response.json();
      
      // Remove notification
      document.body.removeChild(notification);
      
      if (result.success && result.equations && result.equations !== "No equations found") {
        // Parse equations (split by line breaks)
        const equations = result.equations.split('\n').filter((eq: string) => eq.trim().length > 0);
        setExtractedEquations(equations);
        
        // Switch to equations tab
        setActiveTab('equations');
        
        // Show success notification
        const successNotification = document.createElement('div');
        successNotification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successNotification.textContent = `✅ Found ${equations.length} equation(s)!`;
        document.body.appendChild(successNotification);
        
        setTimeout(() => {
          if (document.body.contains(successNotification)) {
            document.body.removeChild(successNotification);
          }
        }, 3000);
        
        console.log('Equations extracted successfully:', equations);
      } else {
        // Show no equations found notification
        const noEquationsNotification = document.createElement('div');
        noEquationsNotification.className = 'fixed top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        noEquationsNotification.textContent = '📝 No equations found in drawing';
        document.body.appendChild(noEquationsNotification);
        
        setTimeout(() => {
          if (document.body.contains(noEquationsNotification)) {
            document.body.removeChild(noEquationsNotification);
          }
        }, 3000);
        
        console.log('No equations found in the image');
      }
    } catch (error) {
      console.error('Error extracting equations:', error);
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorNotification.textContent = '❌ Error extracting equations';
      document.body.appendChild(errorNotification);
      
      setTimeout(() => {
        if (document.body.contains(errorNotification)) {
          document.body.removeChild(errorNotification);
        }
      }, 3000);
    }
  };

  const handleConvertToGraph = async (equation: string) => {
    try {
      // Show a temporary notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = '📊 Converting to graph...';
      document.body.appendChild(notification);
      
      // Send equation to API for GeoGebra conversion
      const response = await fetch('/api/convert-to-geogebra', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equation
        }),
      });

      const result = await response.json();
      
      // Remove notification
      document.body.removeChild(notification);
      
      if (result.success && result.geogebraEquation) {
        // Add to graphs array
        const newGraph = {
          equation: equation,
          geogebraEquation: result.geogebraEquation
        };
        
        setGeogebraGraphs(prev => [...prev, newGraph]);
        
        // Switch to graphs tab (we'll create this)
        setActiveTab('graphs');
        
        // Show success notification
        const successNotification = document.createElement('div');
        successNotification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successNotification.textContent = '✅ Graph created successfully!';
        document.body.appendChild(successNotification);
        
        setTimeout(() => {
          if (document.body.contains(successNotification)) {
            document.body.removeChild(successNotification);
          }
        }, 3000);
        
        console.log('Equation converted to graph:', result.geogebraEquation);
      } else {
        // Show error notification
        const errorNotification = document.createElement('div');
        errorNotification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        errorNotification.textContent = '❌ Cannot convert this equation to graph';
        document.body.appendChild(errorNotification);
        
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification);
          }
        }, 3000);
        
        console.log('Cannot convert equation to graph:', result.error);
      }
    } catch (error) {
      console.error('Error converting equation to graph:', error);
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorNotification.textContent = '❌ Error converting to graph';
      document.body.appendChild(errorNotification);
      
      setTimeout(() => {
        if (document.body.contains(errorNotification)) {
          document.body.removeChild(errorNotification);
        }
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white">Initializing Math Studium...</div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-zinc-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Math Studium</h1>
            <div className="flex space-x-2 text-sm">
              <Link 
                href="/clear-cache" 
                className="text-orange-400 hover:text-orange-300 underline"
              >
                Clear Cache
              </Link>
              <Link 
                href="/test-gemini" 
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Test Gemini
              </Link>
              <Link 
                href="/test-auth" 
                className="text-green-400 hover:text-green-300 underline"
              >
                Test Auth
              </Link>
              <Link 
                href="/admin" 
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Admin Panel
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="text-red-400 text-center">
              <div className="font-semibold">Authentication Error:</div>
              <div className="text-sm mt-1">{authError}</div>
              <div className="text-xs mt-2 text-zinc-400">
                This might be because anonymous authentication is not enabled in Firebase Console.
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={retryAuth}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Retry Authentication
              </button>
              <Link
                href="/test-auth"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Debug Authentication
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-900">
      {/* Global Header */}
      <header className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <div className={`transition-all duration-300 ${leftSidebarOpen ? 'w-72' : 'w-16'}`}>
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-white" />
            {leftSidebarOpen && <h1 className="text-xl font-semibold text-white">Math Studium</h1>}
          </div>
        </div>
        <div className="flex-1 text-center text-sm text-zinc-400">
          {selectedPdf ? selectedPdf.name : 'Math Learning Platform'}
        </div>
        <div className="flex items-center space-x-3 w-72 justify-end">
          <div className="flex space-x-1 text-xs">
            <Link 
              href="/clear-cache" 
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Cache
            </Link>
            <Link 
              href="/test-gemini" 
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Test
            </Link>
            <Link 
              href="/admin" 
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Admin
            </Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-100"
              >
                <Globe className="w-4 h-4" />
                <span>EN</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700 text-zinc-50">
              <DropdownMenuItem className="hover:bg-zinc-700">English</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-700">Español</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`transition-all duration-300 ${leftSidebarOpen ? 'w-72' : 'w-16'} p-5 bg-zinc-900 border-r border-zinc-800 flex flex-col space-y-6`}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="self-start text-zinc-400 hover:text-zinc-100"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </Button>
          
          {leftSidebarOpen && (
            <>
              <div className="space-y-4">
                <PdfUploader onPdfSelect={handlePdfSelect} />
                <Button 
                  onClick={() => setShowCanvas(!showCanvas)}
                  className={`w-full justify-start text-left h-10 ${showCanvas ? 'bg-zinc-700' : 'bg-zinc-800'} hover:bg-zinc-700 text-white`}
                >
                  <Palette className="w-4 h-4 mr-2" />
                  {showCanvas ? 'Hide Canvas' : 'Show Canvas'}
                </Button>
                <Button 
                  onClick={() => setSelectedPdf(null)}
                  className="w-full justify-start text-left bg-zinc-800 hover:bg-zinc-700 text-white h-10"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Blank Canvas
                </Button>
              </div>
              <div className="flex-1 space-y-3 text-zinc-400 text-sm">
                <h2 className="font-semibold text-white text-base">Welcome to Math Studium</h2>
                <p>An AI-powered learning platform for mathematics.</p>
                <p>
                  Upload PDF files, draw annotations, and chat with AI to enhance your learning experience.
                </p>
                <p>
                  Features include PDF viewing, canvas drawing, flashcards, quizzes, and interactive AI conversations.
                </p>
              </div>
            </>
          )}
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col overflow-hidden bg-zinc-850">
          <div className="p-3 border-b border-zinc-700 flex items-center space-x-2 bg-zinc-900">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Sun className="w-5 h-5" />
            </Button>
            {selectedPdf && (
              <>
                <div className="flex items-center space-x-1 text-zinc-400">
                  <Input
                    type="number"
                    defaultValue={1}
                    className="w-12 h-8 text-center bg-zinc-800 border-zinc-700 text-zinc-50"
                  />
                  <span>/</span>
                  <span>--</span>
                </div>
                <Select defaultValue="page-fit">
                  <SelectTrigger className="w-[120px] h-8 bg-zinc-800 border-zinc-700 text-zinc-50">
                    <SelectValue placeholder="Page fit" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-50">
                    <SelectItem value="page-fit" className="hover:!bg-zinc-700">
                      Page fit
                    </SelectItem>
                    <SelectItem value="page-width" className="hover:!bg-zinc-700">
                      Page width
                    </SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <RotateCcw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Download className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Printer className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Maximize className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="text-zinc-400 hover:text-zinc-100"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${rightSidebarOpen ? '' : 'rotate-180'}`} />
            </Button>
          </div>
          
          <div className="flex-1 relative overflow-hidden bg-zinc-800">
            {selectedPdf ? (
              <div className="h-full w-full relative">
                <PdfViewer file={selectedPdf} />
                {showCanvas && (
                  <div className="absolute inset-0 pointer-events-auto">
                    <CanvasOverlay 
                      width={windowWidth - (leftSidebarOpen ? 288 : 64) - (rightSidebarOpen ? 400 : 0)} 
                      height={windowHeight - 120}
                      onTransferToChat={handleTransferToChat}
                      onTransferEquation={handleTransferEquation}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full w-full relative">
                {showCanvas ? (
                  // Canvas-only mode
                  <div className="h-full w-full bg-zinc-800">
                    <CanvasOverlay 
                      width={windowWidth - (leftSidebarOpen ? 288 : 64) - (rightSidebarOpen ? 400 : 0)} 
                      height={windowHeight - 120}
                      onTransferToChat={handleTransferToChat}
                      onTransferEquation={handleTransferEquation}
                    />
                  </div>
                ) : (
                  // Welcome screen
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-zinc-400 space-y-4">
                      <FileText className="w-24 h-24 mx-auto text-zinc-600" />
                      <h2 className="text-2xl font-semibold text-zinc-300">Welcome to Math Studium</h2>
                      <p className="text-lg">Upload a PDF or start with a blank canvas</p>
                      <div className="flex space-x-4 justify-center">
                        <Button 
                          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Upload PDF
                        </Button>
                        <Button 
                          onClick={() => setShowCanvas(true)}
                          variant="outline"
                          className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                        >
                          <Palette className="w-4 h-4 mr-2" />
                          Start Drawing
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Sidebar (Chat Panel) */}
        {rightSidebarOpen && (
          <aside className="w-[400px] bg-zinc-900 border-l border-zinc-800 flex flex-col">
            <div className="p-3 border-b border-zinc-800 flex items-center space-x-1">
              <Button 
                variant="ghost" 
                className={`h-9 px-3 ${activeTab === 'chat' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageCircle className="w-4 h-4 mr-2" /> Chat
              </Button>
              <Button 
                variant="ghost" 
                className={`h-9 px-3 ${activeTab === 'voice' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                onClick={() => setActiveTab('voice')}
              >
                <Mic className="w-4 h-4 mr-2" /> Voice
              </Button>
              <Button 
                variant="ghost" 
                className={`h-9 px-3 ${activeTab === 'flashcards' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                onClick={() => setActiveTab('flashcards')}
              >
                <Copy className="w-4 h-4 mr-2" /> Cards
              </Button>
              <Button 
                variant="ghost" 
                className={`h-9 px-3 ${activeTab === 'quizzes' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                onClick={() => setActiveTab('quizzes')}
              >
                <ClipboardCheck className="w-4 h-4 mr-2" /> Quiz
              </Button>
              <Button 
                variant="ghost" 
                className={`h-9 px-3 ${activeTab === 'summary' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                onClick={() => setActiveTab('summary')}
              >
                <AlignLeft className="w-4 h-4 mr-2" /> Notes
              </Button>
              <Button 
                variant="ghost" 
                className={`h-9 px-3 ${activeTab === 'equations' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                onClick={() => setActiveTab('equations')}
              >
                <Calculator className="w-4 h-4 mr-2" /> Equations
              </Button>
              <Button 
                variant="ghost" 
                className={`h-9 px-3 ${activeTab === 'graphs' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                onClick={() => setActiveTab('graphs')}
              >
                <BarChart3 className="w-4 h-4 mr-2" /> Graphs
              </Button>
            </div>

            <div className="flex-1 flex flex-col">
              {activeTab === 'chat' && user ? (
                <Chat userId={user.uid} />
              ) : activeTab === 'voice' ? (
                <div className="flex-1 flex flex-col p-4">
                  <SimpleVoiceChat 
                    onTranscriptUpdate={(transcript, isUser) => {
                      // Optionally sync voice transcripts with chat
                      console.log(`${isUser ? 'User' : 'AI'}: ${transcript}`);
                    }}
                  />
                </div>
              ) : activeTab === 'flashcards' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-zinc-400">
                  <Copy className="w-16 h-16 text-zinc-500" />
                  <p className="text-lg font-medium text-zinc-300">Flashcards</p>
                  <p className="text-center text-sm">Create flashcards from your PDF content or chat conversations.</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create Flashcard
                  </Button>
                </div>
              ) : activeTab === 'quizzes' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-zinc-400">
                  <ClipboardCheck className="w-16 h-16 text-zinc-500" />
                  <p className="text-lg font-medium text-zinc-300">Quizzes</p>
                  <p className="text-center text-sm">Generate quizzes based on your study materials.</p>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Start Quiz
                  </Button>
                </div>
              ) : activeTab === 'equations' ? (
                <div className="flex-1 flex flex-col p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-zinc-300">Extracted Equations</h3>
                    <Button 
                      onClick={() => setExtractedEquations([])}
                      variant="outline"
                      size="sm"
                      className="border-zinc-600 text-zinc-400 hover:bg-zinc-700"
                      disabled={extractedEquations.length === 0}
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  {extractedEquations.length > 0 ? (
                    <div className="space-y-4 flex-1 overflow-y-auto">
                      {extractedEquations.map((equation, index) => (
                        <div key={index} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-500">Equation {index + 1}</span>
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(equation);
                                // Show copy notification
                                const notification = document.createElement('div');
                                notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-3 py-1 rounded text-sm z-50';
                                notification.textContent = '📋 Copied! Paste in GeoGebra';
                                document.body.appendChild(notification);
                                setTimeout(() => {
                                  if (document.body.contains(notification)) {
                                    document.body.removeChild(notification);
                                  }
                                }, 3000);
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-zinc-400 hover:text-zinc-200 h-6 w-6 p-0"
                              title="Copy to use in GeoGebra"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {/* LaTeX Rendered Equation */}
                          <div className="equation-container">
                            <LaTeXRenderer 
                              equation={equation} 
                              displayMode={true}
                              className="math-display"
                            />
                          </div>
                          
                          {/* Raw LaTeX Code */}
                          <div className="bg-zinc-900 rounded p-2 text-xs font-mono text-zinc-300 border border-zinc-600">
                            <code>{equation}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-zinc-400">
                      <Calculator className="w-16 h-16 text-zinc-500" />
                      <p className="text-lg font-medium text-zinc-300">No Equations Yet</p>
                      <p className="text-center text-sm">Draw mathematical equations on the canvas and use "Transfer Equation" to extract them.</p>
                      <div className="text-xs text-zinc-500 text-center">
                        <p>Supported formats:</p>
                        <p>• Handwritten equations</p>
                        <p>• Mathematical expressions</p>
                        <p>• Formulas and derivations</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === 'graphs' ? (
                <div className="flex-1 flex flex-col p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-zinc-300 mb-2">GeoGebra Calculator</h3>
                    <p className="text-sm text-zinc-400">Interactive mathematical graphing and calculation tool</p>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <EmbeddedGeoGebra 
                      width={380}
                      height={500}
                    />
                  </div>
                  
                  {extractedEquations.length > 0 && (
                    <div className="mt-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                      <div className="text-sm font-medium text-zinc-300 mb-2">Your Extracted Equations:</div>
                      <div className="space-y-1">
                        {extractedEquations.map((equation, index) => (
                          <div key={index} className="text-xs font-mono text-zinc-400 bg-zinc-900 rounded px-2 py-1">
                            {equation}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-zinc-500 mt-2">
                        💡 Copy these equations and paste them into the GeoGebra calculator above
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-zinc-400">
                  <AlignLeft className="w-16 h-16 text-zinc-500" />
                  <p className="text-lg font-medium text-zinc-300">Study Notes</p>
                  <p className="text-center text-sm">AI-generated summaries and key points from your materials.</p>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Generate Notes
                  </Button>
                </div>
              )}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};

export default Home; 