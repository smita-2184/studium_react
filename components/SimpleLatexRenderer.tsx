import React, { useEffect, useRef } from 'react';

interface SimpleLatexRendererProps {
  equation: string;
  displayMode?: boolean;
  className?: string;
}

export const SimpleLatexRenderer: React.FC<SimpleLatexRendererProps> = ({ 
  equation, 
  displayMode = true, 
  className = "" 
}) => {
  const mathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mathRef.current) {
      // Simple HTML rendering for common LaTeX patterns
      let htmlEquation = equation;
      
      // Replace common LaTeX patterns with HTML
      htmlEquation = htmlEquation
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<div class="fraction"><span class="numerator">$1</span><span class="denominator">$2</span></div>')
        .replace(/\^(\w+|\{[^}]+\})/g, '<sup>$1</sup>')
        .replace(/\_(\w+|\{[^}]+\})/g, '<sub>$1</sub>')
        .replace(/\\frac\{d\}\{dx\}/g, '<div class="fraction"><span class="numerator">d</span><span class="denominator">dx</span></div>')
        .replace(/\\cdot/g, '·')
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\\pm/g, '±')
        .replace(/\\infty/g, '∞')
        .replace(/\\pi/g, 'π')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\gamma/g, 'γ')
        .replace(/\\delta/g, 'δ')
        .replace(/\\theta/g, 'θ')
        .replace(/\\lambda/g, 'λ')
        .replace(/\\mu/g, 'μ')
        .replace(/\\sigma/g, 'σ')
        .replace(/\\phi/g, 'φ')
        .replace(/\\omega/g, 'ω')
        .replace(/\\int/g, '∫')
        .replace(/\\sum/g, '∑')
        .replace(/\\prod/g, '∏')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\lim/g, 'lim')
        .replace(/\\sin/g, 'sin')
        .replace(/\\cos/g, 'cos')
        .replace(/\\tan/g, 'tan')
        .replace(/\\log/g, 'log')
        .replace(/\\ln/g, 'ln')
        .replace(/\\exp/g, 'exp')
        .replace(/\{/g, '')
        .replace(/\}/g, '');

      mathRef.current.innerHTML = `
        <div class="simple-math-display">
          ${htmlEquation}
        </div>
      `;
    }
  }, [equation]);

  return (
    <div 
      ref={mathRef} 
      className={`simple-math-container ${className}`}
    />
  );
}; 