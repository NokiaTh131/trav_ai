import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User } from 'lucide-react';
import { type Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
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
        </div>

      </div>
    </div>
  );
};

export default ChatMessage;
