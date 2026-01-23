import React from 'react';
import { Plus, MessageSquare, Trash2, Settings, X, Map } from 'lucide-react';
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
      ${isOpen ? 'w-72 min-w-72' : 'w-0 min-w-0'}
      bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 overflow-hidden relative shadow-2xl z-20
    `}>
      {/* Sidebar Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-serif tracking-wide">
          <Map className="text-orange-500" />
          <span className="font-bold text-lg tracking-tight">Travai Guide</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors md:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pb-6">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-900/20 transition-all transform hover:scale-[1.02]"
        >
          <Plus size={18} /> New Journey
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        <div className="text-xs font-bold text-slate-500 px-3 py-2 uppercase tracking-widest mb-1">Your Trips</div>
        {sessions.map(session => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`
              group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer text-sm transition-all duration-200
              ${currentSessionId === session.id
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
            `}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <MessageSquare size={16} className={currentSessionId === session.id ? 'text-orange-500' : 'text-slate-600'} />
              <span className="truncate max-w-[160px]">{session.title}</span>
            </div>

            <button
              onClick={(e) => onDeleteSession(e, session.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-opacity"
              title="Delete Chat"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Settings Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-3 text-sm text-slate-400 hover:text-white w-full px-2 py-2 rounded-lg hover:bg-slate-800/50 transition-colors"
        >
          <Settings size={18} />
          <span>API Configuration</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
