import React from 'react';
import { Plus, MessageSquare, Trash2, Settings, X } from 'lucide-react';
import { type ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onOpenSettings,
}) => {
  return (
    <div className={`
      ${isOpen ? 'w-65 min-w-65' : 'w-0 min-w-0'}
      bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden relative
    `}>
      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-gray-500 hover:bg-gray-200 p-1 rounded-md"
        >
          <X size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-start gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 shadow-sm transition-colors"
        >
          <Plus size={16} /> New Chat
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <div className="text-xs font-semibold text-gray-400 px-2 py-2 uppercase tracking-wider">Recent</div>
        {sessions.map(session => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`
              group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm
              ${currentSessionId === session.id ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <MessageSquare size={14} />
              <span className="truncate max-w-35">{session.title}</span>
            </div>

            <button
              onClick={(e) => onDeleteSession(e, session.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
              title="Delete Chat"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Settings Area */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 w-full"
        >
          <Settings size={16} /> API Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
