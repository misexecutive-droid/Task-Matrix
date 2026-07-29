import { useState } from 'react';
import { AlignLeft, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { SECTION_HEADER } from './detailConstants';

interface TicketDescriptionProps {
  description?: string;
}

// Automatically converts plain URLs inside description text into clickable links
const renderFormattedText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-500 hover:underline break-all font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export const TicketDescription = ({ description }: TicketDescriptionProps) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const trimmedText = description?.trim();
  if (!trimmedText) return null;

  const isLongText = trimmedText.length > 350;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trimmedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback handling if clipboard permissions are restricted
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header section with copy action */}
      <div className="flex items-center justify-between">
        <h3 className={`${SECTION_HEADER} flex items-center gap-1.5`}>
          <AlignLeft size={13} className="text-text-muted" />
          <span>Description</span>
        </h3>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-text transition-colors p-1 rounded-md hover:bg-surface-muted cursor-pointer"
          title="Copy description"
          aria-label="Copy description"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Description container */}
      <div className="relative rounded-md border border-border/80 bg-surface-muted/20 p-3.5 transition-all">
        <div
          className={`text-xs text-text-secondary leading-relaxed whitespace-pre-wrap break-words ${
            isLongText && !isExpanded ? 'line-clamp-6' : ''
          }`}
        >
          {renderFormattedText(trimmedText)}
        </div>

        {/* Expand / Collapse toggle for long ticket descriptions */}
        {isLongText && (
          <div
            className={`pt-2 flex justify-end ${
              !isExpanded ? 'bg-gradient-to-t from-surface/80 to-transparent -mt-6 pt-6 relative' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-500 hover:text-primary-600 transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <span>Show less</span>
                  <ChevronUp size={12} />
                </>
              ) : (
                <>
                  <span>Show more</span>
                  <ChevronDown size={12} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};