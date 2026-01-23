import React from 'react';
import { Send, Compass } from 'lucide-react';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent | React.KeyboardEvent) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isLoading,
  onChange,
  onSubmit,
}) => {
  return (
    <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-slate-50/95 via-slate-50/80 to-transparent pt-12 pb-6 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 flex items-center p-2 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all transform focus-within:-translate-y-1">
        <div className="pl-3 pr-2 text-orange-500">
          <Compass size={20} />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit(e)}
          placeholder="Ask anything about Thailand..."
          className="flex-1 bg-transparent border-none px-2 py-3 text-slate-900 placeholder-slate-400 focus:outline-none text-base font-medium"
          disabled={isLoading}
        />
        <button
          onClick={onSubmit}
          disabled={isLoading || !input.trim()}
          className={`
              p-3 rounded-xl transition-all duration-300
              ${isLoading || !input.trim()
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95'}
          `}
        >
          <Send size={18} />
        </button>
      </div>
      <div className="text-center mt-3 text-xs font-medium text-slate-400">
        Travai Guide uses AI and may make mistakes. Always check sources.
      </div>
    </div>
  );
};

export default ChatInput;
