import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, BookOpen } from 'lucide-react';
import { type Message, type Source } from '../types';

interface ChatMessageProps {
  message: Message;
  onViewSources?: (sources: Source[]) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onViewSources }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} py-4`}>
      <div className={`flex max-w-3xl w-full gap-4 px-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Avatar */}
        <div className={`
          shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser ? 'bg-gray-800' : 'bg-green-600'}
          text-white
        `}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Message Content */}
        <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
          <div className="font-semibold text-sm text-gray-900 mb-1">
            {isUser ? 'You' : 'Travai Guide'}
          </div>

          {/* Prose for Markdown */}
          <div className={`
            prose prose-sm max-w-none text-gray-800
            prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-900
            ${isUser ? 'bg-gray-100 p-3 rounded-2xl rounded-tr-sm inline-block text-left' : ''}
          `}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>

          {/* Sources Button */}
          {!isUser && message.sources && message.sources.length > 0 && onViewSources && (
            <button
              onClick={() => onViewSources(message.sources!)}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-md transition-colors w-fit"
            >
              <BookOpen size={14} />
              <span>View {message.sources.length} Source{message.sources.length > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatMessage;
