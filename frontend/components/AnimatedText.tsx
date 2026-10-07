"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedTextProps {
  text: string;
  highlightWord?: string;
  highlightClassName?: string;
  className?: string;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  highlightWord = "visible.",
  highlightClassName = "text-lime",
  className = "",
}) => {
  const words = text.split(" ");
  const [currentIndex, setCurrentIndex] = useState(0);
  const wordsToCycle = ["visible.", "connected.", "actionable.", "defensible."];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % wordsToCycle.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [wordsToCycle.length]);

  return (
    <div className={`flex flex-wrap items-center ${className}`}>
      {words.map((word, i) => {
        if (word === highlightWord) {
          return (
            <span key={i} className="inline-block relative overflow-hidden align-bottom min-w-[140px] sm:min-w-[200px] text-left">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordsToCycle[currentIndex]}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`inline-block ${highlightClassName}`}
                >
                  {wordsToCycle[currentIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          );
        }
        return (
          <span key={i} className="mr-2 sm:mr-3">
            {word}
          </span>
        );
      })}
    </div>
  );
};


