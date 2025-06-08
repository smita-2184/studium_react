import React, { useEffect, useRef } from 'react';

interface GeoGebraGraphProps {
  equation: string;
  width?: number;
  height?: number;
  className?: string;
}

declare global {
  interface Window {
    GGBApplet: any;
  }
}

export const GeoGebraGraph: React.FC<GeoGebraGraphProps> = ({ 
  equation, 
  width = 600, 
  height = 400,
  className = "" 
}) => {
  const geogebraRef = useRef<HTMLDivElement>(null);
  const appletRef = useRef<any>(null);

  useEffect(() => {
    // Load GeoGebra script if not already loaded
    if (!window.GGBApplet) {
      const script = document.createElement('script');
      script.src = 'https://www.geogebra.org/apps/deployggb.js';
      script.onload = () => {
        initializeGeoGebra();
      };
      document.head.appendChild(script);
    } else {
      initializeGeoGebra();
    }
  }, []);

  useEffect(() => {
    // Update equation when it changes
    if (appletRef.current && equation) {
      try {
        // Clear previous objects
        appletRef.current.deleteObject('f');
        
        // Add new equation
        appletRef.current.evalCommand(`f(x) = ${equation}`);
        
        // Zoom to fit
        appletRef.current.setCoordSystem(-10, 10, -10, 10);
      } catch (error) {
        console.error('Error updating GeoGebra equation:', error);
      }
    }
  }, [equation]);

  const initializeGeoGebra = () => {
    if (geogebraRef.current && window.GGBApplet) {
      // Clear any existing content
      geogebraRef.current.innerHTML = '';
      
      const parameters = {
        "appName": "graphing",
        "width": width,
        "height": height,
        "showToolBar": false,
        "showAlgebraInput": false,
        "showMenuBar": false,
        "showResetIcon": true,
        "enableLabelDrags": false,
        "enableShiftDragZoom": true,
        "enableRightClick": false,
        "errorDialogsActive": false,
        "useBrowserForJS": false,
        "allowStyleBar": false,
        "preventFocus": false,
        "showZoomButtons": true,
        "showFullscreenButton": true,
        "scale": 1,
        "autoHeight": false,
        "disableAutoScale": false,
        "allowUpscale": false,
        "clickToLoad": false,
        "appletOnLoad": function(api: any) {
          appletRef.current = api;
          
          // Set up the coordinate system
          api.setCoordSystem(-10, 10, -10, 10);
          
          // Add initial equation if provided
          if (equation) {
            try {
              api.evalCommand(`f(x) = ${equation}`);
            } catch (error) {
              console.error('Error setting initial equation:', error);
            }
          }
        }
      };

      const applet = new window.GGBApplet(parameters, true);
      applet.inject(geogebraRef.current);
    }
  };

  return (
    <div className={`geogebra-container ${className}`}>
      <div 
        ref={geogebraRef} 
        className="geogebra-applet"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      {equation && (
        <div className="mt-2 text-sm text-zinc-600 text-center">
          Graphing: <code className="bg-zinc-100 px-2 py-1 rounded">{equation}</code>
        </div>
      )}
    </div>
  );
}; 