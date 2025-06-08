"use client";

import React, { useState, useRef, useEffect } from 'react';

interface CanvasOverlayProps {
  width: number;
  height: number;
  onTransferToChat?: (imageData: string) => void;
  onTransferEquation?: (imageData: string) => void;
}

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({ width, height, onTransferToChat, onTransferEquation }) => {
  const [lines, setLines] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [konvaComponents, setKonvaComponents] = useState<any>(null);
  const [currentColor, setCurrentColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState(3);
  const isDrawing = useRef(false);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import react-konva components
    const loadKonva = async () => {
      try {
        const konva = await import('react-konva');
        setKonvaComponents({
          Stage: konva.Stage,
          Layer: konva.Layer,
          Line: konva.Line
        });
      } catch (error) {
        console.error('Failed to load Konva:', error);
      }
    };

    loadKonva();
  }, []);

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { 
      points: [pos.x, pos.y], 
      id: Date.now(),
      color: currentColor,
      strokeWidth: brushSize
    }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    setLines(prevLines => {
      const newLines = [...prevLines];
      const lastLine = newLines[newLines.length - 1];
      if (lastLine) {
        lastLine.points = lastLine.points.concat([point.x, point.y]);
      }
      return newLines;
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    setLines([]);
  };

  const transferToChat = () => {
    if (stageRef.current && onTransferToChat) {
      try {
        // Convert canvas to base64 image
        const dataURL = stageRef.current.toDataURL({
          mimeType: 'image/jpeg',
          quality: 0.8,
          pixelRatio: 1
        });
        
        // Extract base64 data (remove data:image/jpeg;base64, prefix)
        const base64Data = dataURL.split(',')[1];
        onTransferToChat(base64Data);
      } catch (error) {
        console.error('Error capturing canvas:', error);
      }
    }
  };

  const transferEquation = () => {
    if (stageRef.current && onTransferEquation) {
      try {
        // Convert canvas to base64 image
        const dataURL = stageRef.current.toDataURL({
          mimeType: 'image/jpeg',
          quality: 0.8,
          pixelRatio: 1
        });
        
        // Extract base64 data (remove data:image/jpeg;base64, prefix)
        const base64Data = dataURL.split(',')[1];
        onTransferEquation(base64Data);
      } catch (error) {
        console.error('Error capturing canvas for equation:', error);
      }
    }
  };

  if (!isClient || !konvaComponents) {
    return (
      <div 
        className="absolute top-0 left-0 bg-transparent border-2 border-dashed border-zinc-600 flex items-center justify-center" 
        style={{ width, height }}
      >
        <div className="text-zinc-400 text-center">
          <div className="text-sm">Loading Canvas...</div>
        </div>
      </div>
    );
  }

  const { Stage, Layer, Line } = konvaComponents;

  return (
    <div className="absolute top-0 left-0">
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={transferToChat}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              disabled={lines.length === 0}
            >
              Transfer to Chat
            </button>
            <button
              onClick={transferEquation}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
              disabled={lines.length === 0}
            >
              Transfer Equation
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={clearCanvas}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              Clear
            </button>
            <div className="bg-zinc-800 text-white px-3 py-1 rounded text-sm">
              Lines: {lines.length}
            </div>
          </div>
        </div>
        
        {/* Color Picker */}
        <div className="flex space-x-1">
          {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#000000'].map(color => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`w-6 h-6 rounded border-2 ${currentColor === color ? 'border-white' : 'border-gray-400'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        
        {/* Brush Size */}
        <div className="flex items-center space-x-2 bg-zinc-800 px-3 py-1 rounded">
          <span className="text-white text-xs">Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-16"
          />
          <span className="text-white text-xs">{brushSize}px</span>
        </div>
      </div>

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{ cursor: 'crosshair' }}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={line.id || i}
              points={line.points}
              stroke={line.color || "#ef4444"}
              strokeWidth={line.strokeWidth || 3}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation="source-over"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}; 