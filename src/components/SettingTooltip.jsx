import { useState } from 'react';
import { cn } from '@/lib/utils';

export function SettingTooltip({ text }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative inline-block ml-1"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span
        className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors cursor-help"
        aria-label="Help"
      >
        ?
      </span>
      
      {isOpen && (
        <div className="absolute z-50 w-64 p-3 text-sm bg-popover text-popover-foreground rounded-lg shadow-lg border border-border top-0 left-full ml-2 animate-in fade-in duration-200">
          <p className="whitespace-pre-line">{text}</p>
          <div className="absolute top-2 -left-2 w-2 h-2 bg-popover border-l border-t border-border rotate-45" />
        </div>
      )}
    </div>
  );
}