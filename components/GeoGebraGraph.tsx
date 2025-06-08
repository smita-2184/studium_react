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
      console.log('Loading GeoGebra script...');
      const script = document.createElement('script');
      script.src = 'https://www.geogebra.org/apps/deployggb.js';
      script.onload = () => {
        console.log('GeoGebra script loaded successfully');
        setTimeout(initializeGeoGebra, 100); // Small delay to ensure script is ready
      };
      script.onerror = () => {
        console.error('Failed to load GeoGebra script');
      };
      document.head.appendChild(script);
    } else {
      console.log('GeoGebra already loaded, initializing...');
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
    console.log('Initializing GeoGebra...', { 
      hasRef: !!geogebraRef.current, 
      hasGGBApplet: !!window.GGBApplet,
      equation 
    });
    
    if (geogebraRef.current && window.GGBApplet) {
      // Clear any existing content
      geogebraRef.current.innerHTML = '';
      
      // Add a loading indicator
      geogebraRef.current.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; border-radius: 8px;"><div>Loading GeoGebra...</div></div>';
      
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
          console.log('GeoGebra applet loaded successfully', api);
          appletRef.current = api;
          
          // Set up the coordinate system
          api.setCoordSystem(-10, 10, -10, 10);
          
          // Add initial equation if provided
          if (equation) {
            try {
              console.log('Setting initial equation:', equation);
              api.evalCommand(`f(x) = ${equation}`);
            } catch (error) {
              console.error('Error setting initial equation:', error);
            }
          }
        }
      };

      try {
        console.log('Creating GeoGebra applet with parameters:', parameters);
        const applet = new window.GGBApplet(parameters, true);
        applet.inject(geogebraRef.current);
      } catch (error) {
        console.error('Error creating GeoGebra applet:', error);
        if (geogebraRef.current) {
          geogebraRef.current.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #fee; border-radius: 8px; color: red;"><div>Error loading GeoGebra</div></div>';
        }
      }
    } else {
      console.error('Cannot initialize GeoGebra:', {
        hasRef: !!geogebraRef.current,
        hasGGBApplet: !!window.GGBApplet
      });
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