import React, { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, BookOpen, Sparkles, MapPin, Compass, Map as MapIcon, Binoculars, Plane, Ship } from 'lucide-react';
import { type Message, type Source } from '../types';

interface ChatMessageProps {
  message: Message;
  onViewSources?: (sources: Source[]) => void;
  onLocationClick?: (location: string) => void;
}

const ThinkingIndicator = () => {
  const [step, setStep] = useState(0);
  
  const steps = useMemo(() => [
    { icon: Compass, text: "Calibrating compass..." },
    { icon: MapIcon, text: "Unfolding the map..." },
    { icon: Binoculars, text: "Scouting the area..." },
    { icon: Ship, text: "Navigating the Chao Phraya..." },
    { icon: Plane, text: "Flying to destination..." },
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 1500); // Change every 1.5s
    return () => clearInterval(interval);
  }, [steps.length]);

  const CurrentIcon = steps[step].icon;

  return (
    <div className="flex items-center gap-3 text-slate-600 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm w-fit animate-in fade-in duration-300">
      <div className="relative w-5 h-5 flex items-center justify-center">
        <CurrentIcon size={20} className="animate-bounce text-orange-500" />
      </div>
      <span className="text-sm font-medium tracking-wide animate-pulse">
        {steps[step].text}
      </span>
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onViewSources, onLocationClick }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} py-6`}>
      <div className={`flex max-w-3xl w-full gap-4 px-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Avatar */}
        <div className={`
          shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border
          ${isUser ? 'bg-slate-200 border-slate-300 text-slate-600' : 'bg-orange-100 border-orange-200 text-orange-600'}
        `}>
          {isUser ? <User size={20} /> : <MapPin size={20} />}
        </div>

        {/* Message Content */}
        <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
          <div className={`font-bold text-sm mb-1 ${isUser ? 'text-slate-900' : 'text-orange-600'}`}>
            {isUser ? 'You' : 'Travai Guide'}
          </div>

          {/* Tool Calls (Thinking State) */}
          {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {message.toolCalls.map((tool, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 w-fit animate-pulse">
                  <Sparkles size={12} className="text-orange-400" />
                  <span className="font-medium tracking-wide">Exploring {tool.name}...</span>
                </div>
              ))}
            </div>
          )}

          {/* Prose for Markdown */}
          <div className={`
            prose prose-sm max-w-none 
            ${isUser 
              ? 'bg-slate-800 text-white p-4 rounded-2xl rounded-tr-sm shadow-md' 
              : !message.content 
                ? 'bg-transparent p-0' // Remove background for loading state
                : 'text-slate-700 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-a:text-orange-600'}
          `}>
            {!isUser && !message.content ? (
              <ThinkingIndicator />
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                urlTransform={(url) => {
                  if (url.startsWith('location://')) return url;
                  return url;
                }}
                components={{
                  // Override paragraph for user messages to ensure white text inheritance
                  p: ({node, ...props}) => <p className={isUser ? 'text-white' : ''} {...props} />,
                  // Custom renderer for Location Links
                  a: ({node, href, children, ...props}) => {
                    if (href && (href.startsWith('location://') || href.includes('travai.location'))) {
                      const locationName = href.replace('location://', '').replace('http://travai.location/', '').replace('https://travai.location/', '');
                      const decodedName = decodeURIComponent(locationName);
                      
                      return (
                        <span className="inline-block align-middle mx-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (onLocationClick) onLocationClick(decodedName);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 hover:text-orange-900 font-bold border border-orange-300 rounded-full transition-all cursor-pointer shadow-xs hover:shadow-sm transform hover:-translate-y-0.5 active:translate-y-0 text-xs no-underline"
                            title={`Ask about ${decodedName}`}
                          >
                            <MapPin size={12} className="text-orange-600" />
                            {children}
                          </button>
                        </span>
                      );
                    }
                    return <a href={href} {...props} className="text-orange-600 hover:underline">{children}</a>
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Sources Button */}
          {!isUser && message.sources && message.sources.length > 0 && onViewSources && (
            <button
              onClick={() => onViewSources(message.sources!)}
              className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 shadow-sm transition-colors w-fit"
            >
              <BookOpen size={14} className="text-orange-500" />
              <span>Verified Sources ({message.sources.length})</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatMessage;
