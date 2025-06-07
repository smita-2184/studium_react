"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PdfUploader } from '@/components/PdfUploader';
import {
  Plus,
  PenSquare,
  GraduationCap,
  ChevronDown,
  PanelLeftOpen,
  PanelRightOpen,
  X,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CanvasOverlay } from '@/components/CanvasOverlay';

const PdfViewer = dynamic(() => import('@/components/PdfViewer').then(mod => mod.PdfViewer), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <p className="text-lg">Loading PDF Viewer...</p>
    </div>
  ),
});

export default function Home() {
  const [showUploader, setShowUploader] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [canvasMode, setCanvasMode] = useState(false);
  const [blankCanvasActive, setBlankCanvasActive] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const pdfViewerContainerRef = useRef<HTMLDivElement>(null);
  const [viewerSize, setViewerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = pdfViewerContainerRef.current;
    if (container) {
      const observer = new ResizeObserver(() => {
        if (pdfViewerContainerRef.current) {
            const { width, height } = pdfViewerContainerRef.current.getBoundingClientRect();
            setViewerSize({ width, height });
        }
      });
      observer.observe(container);
      return () => observer.disconnect();
    }
  }, []);

  const handleGoHome = () => {
    setSelectedPdf(null);
    setBlankCanvasActive(false);
    setCanvasMode(false);
  }

  const handleBlankCanvasClick = () => {
    setSelectedPdf(null);
    setCanvasMode(false);
    setBlankCanvasActive(true);
  };
  
  const handlePdfSelect = (file: File) => {
    setSelectedPdf(file);
    setBlankCanvasActive(false);
    setShowUploader(false);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-50">
      {/* Global Header */}
      <header className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-30">
        <div className="flex items-center space-x-2">
            <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-zinc-100 md:hidden"
                onClick={() => setLeftSidebarOpen(true)}
            >
                <PanelLeftOpen className="w-5 h-5" />
            </Button>
            <div className="hidden md:block w-72"></div>
        </div>

        <div className="flex-1 text-center text-sm text-zinc-400 truncate px-2">
          {selectedPdf ? selectedPdf.name : blankCanvasActive ? "Blank Canvas" : 'Upload a PDF to get started'}
        </div>

        <div className="flex items-center justify-end space-x-2 w-72">
            <div className="hidden md:flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-100"
                    >
                      <Globe className="w-4 h-4" />
                      <span>US GB</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700 text-zinc-50">
                    <DropdownMenuItem className="hover:bg-zinc-700">US English</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-zinc-700">UK English</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="secondary" className="bg-white text-zinc-900 hover:bg-zinc-200 h-9">
                  Sign in
                </Button>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-zinc-100 md:hidden"
                onClick={() => setRightSidebarOpen(true)}
            >
                <PanelRightOpen className="w-5 h-5" />
            </Button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`absolute md:relative w-72 p-5 bg-zinc-900 border-r border-zinc-800 flex-col space-y-6 z-20 h-full transform transition-transform duration-300 ease-in-out md:translate-x-0 ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:flex`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={handleGoHome}>
                <GraduationCap className="w-8 h-8 text-white" />
                <h1 className="text-2xl font-semibold text-white">YouLearn</h1>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-zinc-100 md:hidden"
                onClick={() => setLeftSidebarOpen(false)}
            >
                <X className="w-5 h-5" />
            </Button>
          </div>
          <Button 
            className="w-full justify-start text-left bg-zinc-800 hover:bg-zinc-700 text-white h-10"
            onClick={() => { setShowUploader(true); setLeftSidebarOpen(false); }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add content
          </Button>
          <Button
            className="w-full justify-start text-left bg-zinc-800 hover:bg-zinc-700 text-white h-10"
            onClick={() => { handleBlankCanvasClick(); setLeftSidebarOpen(false); }}
          >
            <PenSquare className="w-4 h-4 mr-2" />
            Blank Canvas
          </Button>
          <div className="flex-1 space-y-3 text-zinc-400 text-sm">
            <h2 className="font-semibold text-white text-base">Welcome to YouLearn</h2>
            <p>An AI tutor personalized to you.</p>
            <p>
              Understand your files, YouTube video, website links or recorded lecture through key concepts, familiar
              learning tools like flashcards, and interactive conversations.
            </p>
            <p>
              We&apos;re constantly improving the platform, and if you have any feedback, we&apos;d love to hear from
              you.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 text-center">Sign in to continue</p>
            <Button className="w-full bg-white text-zinc-900 hover:bg-zinc-200 h-10">Sign in</Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col overflow-hidden bg-zinc-850">
          <div className="p-3 border-b border-zinc-700 flex items-center justify-between space-x-2 bg-zinc-900">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
                <PanelLeftOpen className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
                <Sun className="w-5 h-5" />
              </Button>
              <Select defaultValue="page-fit">
                <SelectTrigger className="w-[120px] h-8 bg-zinc-800 border-zinc-700 text-zinc-50">
                  <SelectValue placeholder="Page fit" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-50">
                  <SelectItem value="page-fit" className="hover:!bg-zinc-700">Page fit</SelectItem>
                  <SelectItem value="page-width" className="hover:!bg-zinc-700">Page width</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedPdf && (
                <div className="flex items-center space-x-2">
                    <Switch
                        id="canvas-mode"
                        checked={canvasMode}
                        onCheckedChange={setCanvasMode}
                    />
                    <Label htmlFor="canvas-mode" className="text-zinc-300">Turn on Canvas mode</Label>
                </div>
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
          </div>

          {/* PDF Upload Modal */}
          {showUploader && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
              <div className="bg-zinc-900 p-6 rounded-lg shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Upload PDF</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowUploader(false)}
                    className="text-zinc-400 hover:text-zinc-100"
                  >
                    Close
                  </Button>
                </div>
                <PdfUploader onPdfSelect={handlePdfSelect} />
              </div>
            </div>
          )}

          <div ref={pdfViewerContainerRef} className="flex-1 p-4 overflow-auto flex justify-center items-start bg-zinc-800 relative">
            {blankCanvasActive ? (
                <div className="w-full h-full bg-zinc-700 relative">
                    {viewerSize.width > 0 && <CanvasOverlay width={viewerSize.width} height={viewerSize.height} />}
                </div>
            ) : (
                <>
                    <PdfViewer file={selectedPdf} />
                    {selectedPdf && canvasMode && viewerSize.width > 0 && (
                      <CanvasOverlay width={viewerSize.width} height={viewerSize.height} />
                    )}
                </>
            )}
          </div>
        </section>

        {/* Right Sidebar (Chat Panel) */}
        <aside className={`absolute md:relative w-full md:w-[400px] bg-zinc-900 border-l border-zinc-800 flex-col z-20 h-full transform transition-transform duration-300 ease-in-out right-0 md:translate-x-0 ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:flex`}>
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between space-x-1">
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" className="bg-zinc-800 text-white hover:bg-zinc-700 h-9 px-3">
                <MessageCircle className="w-4 h-4 mr-2" /> Chat
              </Button>
              <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-9 px-3">
                <Copy className="w-4 h-4 mr-2" /> Flashcards
              </Button>
              <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-9 px-3 hidden sm:flex">
                <ClipboardCheck className="w-4 h-4 mr-2" /> Quizzes
              </Button>
              <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-9 px-3 hidden lg:flex">
                <AlignLeft className="w-4 h-4 mr-2" /> Summary
              </Button>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-zinc-100 md:hidden"
                onClick={() => setRightSidebarOpen(false)}
            >
                <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-zinc-400">
            <Bot className="w-16 h-16 text-zinc-500" />
            <p className="text-lg font-medium text-zinc-300">Learn with the AI Tutor</p>
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
              {[
                { icon: HelpCircle, label: "Quiz" },
                { icon: Share2, label: "Mind Map" },
                { icon: Mic, label: "Voice Mode" },
                { icon: Copy, label: "Flashcards" },
                { icon: Search, label: "Search" },
                { icon: TrendingUp, label: "Timeline" },
              ].map((item, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="flex-col h-auto py-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-zinc-800 space-y-3">
            <div className="relative">
              <Textarea
                placeholder="Ask anything"
                className="bg-zinc-800 border-zinc-700 text-zinc-50 resize-none pr-28 min-h-[50px] pt-[14px]"
                rows={1}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100 w-7 h-7">
                  <Camera className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100 w-7 h-7">
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
              >
                <Sparkles className="w-4 h-4 mr-1 text-green-400" /> Learn+
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
              >
                <Search className="w-4 h-4 mr-1" /> Search
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300 w-8 h-8"
              >
                <AtSign className="w-4 h-4" />
              </Button>
              <div className="flex-1" />
              <Button className="bg-white text-zinc-900 hover:bg-zinc-200 h-9">
                <Voicemail className="w-4 h-4 mr-2" /> Voice
              </Button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
