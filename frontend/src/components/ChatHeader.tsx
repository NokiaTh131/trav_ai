import React from 'react';
import { Menu, PanelRightClose, PanelLeftClose, MapPin } from 'lucide-react';

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
  isPdfOpen: boolean;
  onTogglePdf: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isSidebarOpen,
  onOpenSidebar,
  isPdfOpen,
  onTogglePdf,
}) => {
  return (
    <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-slate-200 bg-white/80 backdrop-blur-md z-10 sticky top-0">
      <div className="flex items-center gap-3">
        {!isSidebarOpen && (
          <button
            onClick={onOpenSidebar}
            className="text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2 text-slate-900">
          <MapPin size={18} className="text-orange-500" />
          <span className="font-bold text-lg tracking-tight font-serif">Travai Guide</span>
        </div>
      </div>

      {/* PDF Toggle Button */}
      {(
        <button
          onClick={onTogglePdf}
          className={`
            flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-all
            text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm
          `}
        >
          {isPdfOpen ? (
            <>
              <PanelRightClose size={20} className="text-slate-500" />
              <span>Hide Guide</span>
            </>
          ) : (
            <>
              <PanelLeftClose size={20} className="text-slate-500" />
              <span>Show Guide</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ChatHeader;
