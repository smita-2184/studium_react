import React from 'react';

interface EmbeddedGeoGebraProps {
  width?: number;
  height?: number;
  className?: string;
}

export const EmbeddedGeoGebra: React.FC<EmbeddedGeoGebraProps> = ({ 
  width = 800, 
  height = 600,
  className = "" 
}) => {
  return (
    <div className={`embedded-geogebra ${className}`}>
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-lg">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
          <h3 className="text-sm font-medium text-gray-700">GeoGebra Calculator</h3>
          <p className="text-xs text-gray-500">Interactive mathematical graphing tool</p>
        </div>
        <iframe
          src="https://www.geogebra.org/calculator"
          width={width}
          height={height}
          style={{ border: 'none', display: 'block' }}
          title="GeoGebra Calculator"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}; 