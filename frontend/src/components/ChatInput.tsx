import React from 'react';
import { Send } from 'lucide-react';

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
    <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
      <div className="max-w-3xl mx-auto bg-gray-50 border border-gray-200 rounded-2xl shadow-sm flex items-center p-2 focus-within:ring-1 focus-within:ring-gray-300 transition-shadow">
        <input
          type="text"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit(e)}
          placeholder="Ask anything..."
          className="flex-1 bg-transparent border-none px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none text-base"
          disabled={isLoading}
        />
        <button
          onClick={onSubmit}
          disabled={isLoading || !input.trim()}
          className={`
              p-2 rounded-xl transition-all duration-200
              ${isLoading || !input.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800 shadow-md'}
          `}
        >
          <Send size={18} />
        </button>
      </div>
      <div className="text-center mt-3 text-xs text-gray-400">
        Travai Guide can make mistakes. Check sources provided.
      </div>
    </div>
  );
};

export default ChatInput;
