import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function HelpButton({ text }) {
  const [isOpen, setIsOpen] = useState(false);
  const helpRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={helpRef} className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 rounded-full bg-card hover:bg-accent shadow-lg border border-border backdrop-blur-sm transition-colors flex items-center justify-center"
        aria-label="Help"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-[300px] p-4 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border">
          <div className="space-y-2">
            <h3 className="font-semibold">How to Play</h3>
            <p className="text-sm leading-relaxed whitespace-pre-line">{text}</p>
          </div>
          <div className="absolute left-4 bottom-[-6px] w-3 h-3 bg-popover border-b border-r border-border rotate-45" />
        </div>
      )}
    </div>
  );
}