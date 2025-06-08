import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Plus, Trash2, Edit, Save, X, ArrowLeft, ArrowRight, Eye, EyeOff, Copy, Sparkles, Loader2 } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from './ui/hover-card';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

type Mode = 'list' | 'edit' | 'study';

export const FlashcardsMaker: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [mode, setMode] = useState<Mode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [studyIndex, setStudyIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);

  // Function to render math expressions
  const renderMath = (text: string) => {
    try {
      // Split text into math and non-math parts
      const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/);
      return parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Display math
          const math = part.slice(2, -2);
          return (
            <div key={index} className="my-2 text-center" dangerouslySetInnerHTML={{
              __html: katex.renderToString(math, { displayMode: true })
            }} />
          );
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline math
          const math = part.slice(1, -1);
          return (
            <span key={index} dangerouslySetInnerHTML={{
              __html: katex.renderToString(math, { displayMode: false })
            }} />
          );
        }
        // Regular text
        return <span key={index}>{part}</span>;
      });
    } catch (error) {
      console.error('Math rendering error:', error);
      return text;
    }
  };

  // Enhanced 3D Card CSS with better perspective and transform settings
  const card3D = `
    relative w-full max-w-md min-h-[180px] 
    [perspective:2000px] group transform-gpu
  `;

  const cardInner = (flipped: boolean) => `
    relative w-full h-full 
    transition-all duration-700 ease-in-out transform-gpu 
    ${flipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'}
    [transform-style:preserve-3d]
  `;
  
  const cardFace = `
    absolute w-full h-full 
    flex flex-col items-center justify-center p-8 
    rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.2)] 
    bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 
    border border-zinc-700/50 cursor-pointer 
    transition-all duration-300
    [backface-visibility:hidden]
    backdrop-blur-sm hover:border-zinc-600/80
    before:content-[''] before:absolute before:inset-0 
    before:rounded-xl before:bg-gradient-to-r before:from-transparent 
    before:via-white/5 before:to-transparent before:opacity-0 
    hover:before:opacity-100 before:transition-opacity
    [transform:rotateY(0deg)]
  `;

  const cardBack = `
    absolute w-full h-full 
    flex flex-col items-center justify-center p-8 
    rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.3)] 
    bg-gradient-to-br from-blue-900/90 to-indigo-900/90 
    border border-blue-700/50 cursor-pointer 
    transition-all duration-300
    [backface-visibility:hidden]
    backdrop-blur-sm hover:border-blue-500/80
    before:content-[''] before:absolute before:inset-0 
    before:rounded-xl before:bg-gradient-to-r before:from-transparent 
    before:via-white/5 before:to-transparent before:opacity-0 
    hover:before:opacity-100 before:transition-opacity
    [transform:rotateY(180deg)]
  `;

  // Handle card flip with animation lock
  const handleFlip = () => {
    if (!isFlipping) {
      setIsFlipping(true);
      setShowBack(!showBack);
      setTimeout(() => setIsFlipping(false), 700); // Match duration in cardInner
    }
  };

  // Mouse move effect for 3D tilt
  useEffect(() => {
    const cards = document.querySelectorAll('.card-3d');
    
    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const card = (mouseEvent.currentTarget as HTMLElement);
      const cardInner = card.querySelector('.card-inner') as HTMLElement;
      if (!cardInner) return;

      const rect = card.getBoundingClientRect();
      const x = mouseEvent.clientX - rect.left;
      const y = mouseEvent.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / 20) * -1; // Invert Y axis for natural feel
      const rotateY = (centerX - x) / 20;
      
      if (!isFlipping && !showBack) {
        cardInner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    };
    
    const handleMouseLeave = (e: Event) => {
      const card = (e.currentTarget as HTMLElement);
      const cardInner = card.querySelector('.card-inner') as HTMLElement;
      if (!cardInner) return;

      cardInner.style.transform = showBack ? 'rotateY(180deg)' : 'rotateY(0deg)';
    };
    
    cards.forEach(card => {
      card.addEventListener('mousemove', handleMouseMove as EventListener);
      card.addEventListener('mouseleave', handleMouseLeave as EventListener);
    });
    
    return () => {
      cards.forEach(card => {
        card.removeEventListener('mousemove', handleMouseMove as EventListener);
        card.removeEventListener('mouseleave', handleMouseLeave as EventListener);
      });
    };
  }, [isFlipping, showBack]);

  // Add or update card
  const handleSave = () => {
    if (!front.trim() || !back.trim()) return;
    if (editingId) {
      setCards(cards => cards.map(card => card.id === editingId ? { ...card, front, back } : card));
    } else {
      setCards(cards => [...cards, { id: Date.now().toString(), front, back }]);
    }
    setFront('');
    setBack('');
    setEditingId(null);
    setMode('list');
  };

  // Edit card
  const handleEdit = (card: Flashcard) => {
    setEditingId(card.id);
    setFront(card.front);
    setBack(card.back);
    setMode('edit');
  };

  // Delete card
  const handleDelete = (id: string) => {
    setCards(cards => cards.filter(card => card.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFront('');
      setBack('');
      setMode('list');
    }
  };

  // Start studying
  const startStudy = () => {
    setStudyIndex(0);
    setShowBack(false);
    setMode('study');
  };

  // Copy card content
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // AI flashcard generation
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic })
      });
      const data = await res.json();
      if (data.flashcards && Array.isArray(data.flashcards)) {
        setCards(data.flashcards.map((c: any, i: number) => ({ id: Date.now().toString() + i, front: c.front, back: c.back })));
        setMode('list');
      } else {
        setAiError('AI did not return flashcards.');
      }
    } catch (err) {
      setAiError('Failed to generate flashcards.');
    } finally {
      setAiLoading(false);
    }
  };

  // UI
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Flashcards</h2>
        {mode === 'list' && (
          <Button onClick={() => setMode('edit')} size="sm" className="gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
            <Plus className="w-4 h-4" /> New Card
          </Button>
        )}
        {mode === 'study' && (
          <Button onClick={() => setMode('list')} size="sm" variant="outline" className="gap-1 border-zinc-700 hover:bg-zinc-800">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </Button>
        )}
      </div>

      {/* AI Generator */}
      {mode === 'list' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
              placeholder="Enter a topic (e.g. Photosynthesis)"
              className="flex-1 bg-zinc-900/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              disabled={aiLoading}
              maxLength={100}
            />
            <Button 
              onClick={handleAIGenerate} 
              disabled={aiLoading || !aiTopic.trim()} 
              className="gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate
            </Button>
          </div>
          {aiError && <div className="text-red-400 text-sm mt-1">{aiError}</div>}
        </div>
      )}

      {/* List mode */}
      {mode === 'list' && (
        <>
          {cards.length === 0 ? (
            <div className="text-center py-12 px-6 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50">
              <div className="mb-4">
                <Sparkles className="w-12 h-12 mx-auto text-zinc-500 mb-3" />
                <h3 className="text-xl font-semibold text-zinc-300 mb-2">No flashcards yet</h3>
                <p className="text-zinc-400 text-sm">Create your own cards or let AI generate them for you!</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setMode('edit')} variant="outline" className="gap-2 border-zinc-700 hover:bg-zinc-800">
                  <Plus className="w-4 h-4" /> Create Card
                </Button>
                <Button 
                  onClick={() => document.querySelector('input')?.focus()} 
                  className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                >
                  <Sparkles className="w-4 h-4" /> Try AI
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {cards.map(card => (
                <div key={card.id} className={`${card3D} card-3d`}>
                  <div className={`${cardInner(false)} card-inner`}>
                    <div 
                      className={cardFace} 
                      onClick={() => { setStudyIndex(cards.findIndex(c => c.id === card.id)); setShowBack(false); setMode('study'); }}
                    >
                      <div className="text-lg font-medium text-zinc-100 text-center mb-2">
                        {renderMath(card.front)}
                      </div>
                      <div className="text-sm text-zinc-400 text-center">
                        {renderMath(card.back)}
                      </div>
                      
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={(e) => { e.stopPropagation(); handleCopy(card.front + '\n' + card.back); }}
                          className="h-8 w-8 bg-zinc-800/50 hover:bg-zinc-700/50 backdrop-blur-sm"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={(e) => { e.stopPropagation(); handleEdit(card); }}
                          className="h-8 w-8 bg-zinc-800/50 hover:bg-zinc-700/50 backdrop-blur-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={(e) => { e.stopPropagation(); handleDelete(card.id); }}
                          className="h-8 w-8 bg-zinc-800/50 hover:bg-zinc-700/50 backdrop-blur-sm text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {cards.length > 0 && (
            <Button 
              className="mt-6 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md" 
              onClick={startStudy}
            >
              <Eye className="w-4 h-4 mr-2" /> Study Flashcards
            </Button>
          )}
        </>
      )}

      {/* Edit mode */}
      {mode === 'edit' && (
        <Card className="p-6 bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-zinc-300 mb-2 font-medium">Front of Card</label>
              <div className="space-y-2">
                <Input
                  value={front}
                  onChange={e => setFront(e.target.value)}
                  placeholder="Question, term, or prompt (use $ for inline math and $$ for display math)"
                  className="bg-zinc-900/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                  maxLength={200}
                />
                <div className="text-sm text-zinc-400">
                  Preview:
                  <div className="mt-1 p-3 rounded bg-zinc-900/30 min-h-[2rem]">
                    {renderMath(front)}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-zinc-300 mb-2 font-medium">Back of Card</label>
              <div className="space-y-2">
                <Textarea
                  value={back}
                  onChange={e => setBack(e.target.value)}
                  placeholder="Answer, definition, or explanation (use $ for inline math and $$ for display math)"
                  className="bg-zinc-900/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                  maxLength={500}
                  rows={3}
                />
                <div className="text-sm text-zinc-400">
                  Preview:
                  <div className="mt-1 p-3 rounded bg-zinc-900/30 min-h-[2rem]">
                    {renderMath(back)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => { setMode('list'); setEditingId(null); setFront(''); setBack(''); }}
                className="flex-1 border-zinc-700 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!front.trim() || !back.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                {editingId ? 'Update Card' : 'Create Card'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Study mode */}
      {mode === 'study' && cards.length > 0 && (
        <div className="space-y-6">
          <div className={`${card3D} card-3d h-[300px]`}>
            <div className={`${cardInner(showBack)} card-inner`} onClick={handleFlip}>
              <div className={cardFace}>
                <div className="text-2xl font-medium text-zinc-100 text-center">
                  {renderMath(cards[studyIndex].front)}
                </div>
                <div className="absolute bottom-4 text-sm text-zinc-500">Click to flip</div>
              </div>
              <div className={cardBack}>
                <div className="text-xl font-medium text-blue-100 text-center">
                  {renderMath(cards[studyIndex].back)}
                </div>
                <div className="absolute bottom-4 text-sm text-blue-300/70">Click to flip back</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Button
              onClick={() => { 
                setStudyIndex((studyIndex - 1 + cards.length) % cards.length); 
                setShowBack(false);
                setIsFlipping(false);
              }}
              disabled={cards.length <= 1}
              className="gap-2 bg-zinc-800 hover:bg-zinc-700"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
            <div className="text-zinc-400 text-sm">
              Card {studyIndex + 1} of {cards.length}
            </div>
            <Button
              onClick={() => { 
                setStudyIndex((studyIndex + 1) % cards.length); 
                setShowBack(false);
                setIsFlipping(false);
              }}
              disabled={cards.length <= 1}
              className="gap-2 bg-zinc-800 hover:bg-zinc-700"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}; 