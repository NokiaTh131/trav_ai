import React from 'react';
import { Menu, PanelRightClose, PanelLeftClose } from 'lucide-react';

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
  hasPdf: boolean;
  isPdfOpen: boolean;
  onTogglePdf: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isSidebarOpen,
  onOpenSidebar,
  hasPdf,
  isPdfOpen,
  onTogglePdf,
}) => {
  return (
    <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-gray-100 bg-white z-10">
      <div className="flex items-center gap-2">
        {!isSidebarOpen && (
          <button
            onClick={onOpenSidebar}
            className="text-gray-500 hover:bg-gray-100 p-1 rounded-md"
          >
            <Menu size={20} />
          </button>
        )}
        <span className="font-semibold text-gray-700">Travai Guide</span>
      </div>

      {/* PDF Toggle Button */}
      {hasPdf && (
        <button
          onClick={onTogglePdf}
          className={`
            flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition-colors
            text-gray-700 hover:bg-gray-100
          `}
        >
          {isPdfOpen ? (
            <>
              <PanelRightClose size={24} />
            </>
          ) : (
            <>
              <PanelLeftClose size={24} />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ChatHeader;
