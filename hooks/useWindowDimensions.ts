import { useState, useEffect } from 'react';

interface WindowDimensions {
  width: number;
  height: number;
}

export const useWindowDimensions = (): WindowDimensions => {
  // Initialize with a function to avoid unnecessary calculations on every render
  const [windowDimensions, setWindowDimensions] = useState<WindowDimensions>(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return {
      width: 800,
      height: 600,
    };
  });

  useEffect(() => {
    // Only set up event listener if we're in the browser
    if (typeof window === 'undefined') return;

    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Set initial dimensions only if they weren't set in useState initializer
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    
    if (windowDimensions.width !== currentWidth || windowDimensions.height !== currentHeight) {
      setWindowDimensions({
        width: currentWidth,
        height: currentHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array - only run once

  return windowDimensions;
}; 