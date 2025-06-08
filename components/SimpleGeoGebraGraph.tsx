import React from 'react';

interface SimpleGeoGebraGraphProps {
  equation: string;
  width?: number;
  height?: number;
  className?: string;
}

export const SimpleGeoGebraGraph: React.FC<SimpleGeoGebraGraphProps> = ({ 
  equation, 
  width = 600, 
  height = 400,
  className = "" 
}) => {
  // Create a GeoGebra URL with the equation
  const createGeoGebraUrl = (eq: string) => {
    // Encode the equation for URL
    const encodedEquation = encodeURIComponent(`f(x)=${eq}`);
    
    // Create GeoGebra Classic URL with the equation
    return `https://www.geogebra.org/classic?command=${encodedEquation}`;
  };

  return (
    <div className={`simple-geogebra-container ${className}`}>
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <iframe
          src={createGeoGebraUrl(equation)}
          width={width}
          height={height}
          style={{ border: 'none' }}
          title={`Graph of ${equation}`}
          allowFullScreen
        />
      </div>
      {equation && (
        <div className="mt-2 text-sm text-zinc-600 text-center">
          Graphing: <code className="bg-zinc-100 px-2 py-1 rounded">f(x) = {equation}</code>
        </div>
      )}
    </div>
  );
}; 