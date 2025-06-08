import React, { useEffect, useRef } from 'react';

interface LaTeXRendererProps {
  equation: string;
  displayMode?: boolean;
  className?: string;
}

declare global {
  interface Window {
    MathJax: any;
  }
}

export const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ 
  equation, 
  displayMode = true, 
  className = "" 
}) => {
  const mathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load MathJax if not already loaded
    if (!window.MathJax) {
      // Configure MathJax before loading
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true,
          processEnvironments: true
        },
        options: {
          menuOptions: {
            settings: {
              assistiveMml: true
            }
          }
        },
        startup: {
          ready: () => {
            window.MathJax.startup.defaultReady();
            setTimeout(renderMath, 100); // Small delay to ensure MathJax is ready
          }
        }
      };

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
      script.async = true;
      document.head.appendChild(script);
    } else {
      renderMath();
    }
  }, [equation]);

  const renderMath = () => {
    if (mathRef.current) {
      if (window.MathJax && window.MathJax.typesetPromise) {
        // Clear previous content including fallback
        mathRef.current.innerHTML = '';
        
        // Create the math element with proper delimiters
        const mathElement = document.createElement('div');
        mathElement.style.fontSize = '1.6em';
        mathElement.style.lineHeight = '1.8';
        mathElement.style.color = '#000000';
        mathElement.style.textAlign = 'center';
        mathElement.style.padding = '15px';
        mathElement.style.width = '100%';
        
        if (displayMode) {
          mathElement.textContent = `$$${equation}$$`;
        } else {
          mathElement.textContent = `$${equation}$`;
        }
        
        mathRef.current.appendChild(mathElement);
        
        // Typeset the math
        window.MathJax.typesetPromise([mathRef.current]).then(() => {
          console.log('MathJax rendered equation:', equation);
        }).catch((err: any) => {
          console.error('MathJax typeset error:', err);
          // Fallback to formatted text
          if (mathRef.current) {
            mathRef.current.innerHTML = `<div class="math-fallback">$$${equation}$$</div>`;
          }
        });
      } else {
        // Show loading or fallback
        mathRef.current.innerHTML = `<div class="math-fallback">$$${equation}$$</div>`;
        
        // Retry after a short delay
        setTimeout(() => {
          if (window.MathJax && window.MathJax.typesetPromise) {
            renderMath();
          }
        }, 500);
      }
    }
  };

  return (
    <div 
      ref={mathRef} 
      className={`math-container ${className}`}
      style={{ minHeight: '60px', width: '100%' }}
    >
      {/* Fallback content while MathJax loads */}
      <div className="math-fallback">
        {equation}
      </div>
    </div>
  );
}; 