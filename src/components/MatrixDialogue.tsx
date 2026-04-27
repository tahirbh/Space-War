import { useState, useEffect, useMemo } from 'react';

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
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Split the current message text into paragraphs
  const paragraphs = useMemo(() => {
    if (currentMessageIndex >= messages.length) return [];
    return messages[currentMessageIndex].text.split('\n\n');
  }, [currentMessageIndex, messages]);

  const currentMessage = messages[currentMessageIndex];

  useEffect(() => {
    if (currentMessageIndex >= messages.length) {
      onComplete();
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let charIndex = 0;
    const text = paragraphs[currentParagraphIndex] || '';

    const timer = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText((prev) => prev + text[charIndex]);
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 30); // Slightly faster typing

    return () => clearInterval(timer);
  }, [currentMessageIndex, currentParagraphIndex, paragraphs, onComplete]);

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(paragraphs[currentParagraphIndex]);
      setIsTyping(false);
    } else {
      if (currentParagraphIndex < paragraphs.length - 1) {
        setCurrentParagraphIndex((prev) => prev + 1);
      } else if (currentMessageIndex < messages.length - 1) {
        setCurrentMessageIndex((prev) => prev + 1);
        setCurrentParagraphIndex(0);
      } else {
        onComplete();
      }
    }
  };

  if (!currentMessage) return null;

  return (
    <div 
      className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[85%] max-w-3xl bg-black/95 border-2 border-green-500/40 p-8 rounded-xl shadow-[0_0_50px_rgba(34,197,94,0.2)] font-mono z-50 cursor-pointer backdrop-blur-sm"
      onClick={handleNext}
    >
      {/* Matrix Glitch Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full shadow-[0_0_10px_rgba(34,197,94,1)]" />
        <span className="text-green-500 font-bold uppercase tracking-[0.3em] text-xs">
          DECODING SIGNAL: [{currentMessage.speaker}]
        </span>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-green-500/50 to-transparent" />
        <span className="text-green-500/40 text-[10px]">
          PARA {currentParagraphIndex + 1}/{paragraphs.length}
        </span>
      </div>
      
      {/* Content Area */}
      <div className="min-h-[120px] flex flex-col justify-center">
        <p className="text-green-400 text-xl leading-relaxed font-medium">
          {displayedText}
          {isTyping && <span className="animate-pulse ml-1 inline-block w-2 h-5 bg-green-500/70 align-middle" />}
        </p>
      </div>

      {/* Interactive Footer */}
      <div className="mt-6 flex justify-between items-end">
        <div className="space-y-1">
          <div className="text-[10px] text-green-500/30 uppercase tracking-[0.2em]">Secure Comm Link 0x88F2</div>
          <div className="text-[9px] text-green-500/20 font-light">SYSTEM READY // WAITING FOR ACKNOWLEDGMENT...</div>
        </div>
        
        <button 
          className={`px-4 py-1 border border-green-500/50 text-green-500 text-[10px] uppercase tracking-widest hover:bg-green-500/10 transition-colors flex items-center gap-2 ${!isTyping ? 'animate-bounce' : 'opacity-50'}`}
        >
          {currentParagraphIndex < paragraphs.length - 1 ? 'Next Paragraph' : 'Continue Mission'}
          <span className="text-xs">→</span>
        </button>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500/50 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500/50 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500/50 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500/50 rounded-br-lg" />
    </div>
  );
}
