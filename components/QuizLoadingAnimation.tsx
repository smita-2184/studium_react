import React from 'react';
import { motion } from 'framer-motion';

export function QuizLoadingAnimation() {
  return (
    <div className="relative w-full h-48 overflow-hidden rounded-lg">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        style={{
          backgroundSize: '200% 200%',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white text-center">
          <h3 className="text-xl font-semibold mb-2">Generating Your Quiz</h3>
          <p className="text-sm opacity-80">Please wait while we create the perfect questions for you...</p>
        </div>
      </div>
    </div>
  );
} 