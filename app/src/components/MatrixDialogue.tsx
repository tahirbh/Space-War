import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Message {
  speaker: string;
  text: string;
}

interface MatrixDialogueProps {
  messages: Message[];
  onComplete: () => void;
}

export function MatrixDialogue({ messages, onComplete }: MatrixDialogueProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const currentMessage = messages[currentMessageIndex];

  useEffect(() => {
    if (currentMessageIndex >= messages.length) {
      onComplete();
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let charIndex = 0;
    const text = messages[currentMessageIndex].text;

    const timer = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText((prev) => prev + text[charIndex]);
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 40);

    return () => clearInterval(timer);
  }, [currentMessageIndex, messages, onComplete]);

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(currentMessage.text);
      setIsTyping(false);
    } else {
      if (currentMessageIndex < messages.length - 1) {
        setCurrentMessageIndex((prev) => prev + 1);
      } else {
        onComplete();
      }
    }
  };

  return (
    <div 
      className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] max-w-2xl bg-black/90 border-2 border-green-500/50 p-6 rounded-lg shadow-[0_0_30px_rgba(34,197,94,0.3)] font-mono z-50 cursor-pointer"
      onClick={handleNext}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-500 font-bold uppercase tracking-wider text-sm">
          [{currentMessage.speaker}]
        </span>
        <div className="flex-1 h-[1px] bg-green-500/30" />
      </div>
      
      <p className="text-green-400 text-lg leading-relaxed min-h-[4.5rem]">
        {displayedText}
        {isTyping && <span className="animate-pulse ml-1 opacity-70">_</span>}
      </p>

      <div className="mt-4 flex justify-between items-center text-[10px] text-green-500/50 uppercase tracking-[0.2em]">
        <span>Encrypted Channel: 0x88F2...</span>
        <span className="animate-bounce">Click to continue</span>
      </div>
    </div>
  );
}
