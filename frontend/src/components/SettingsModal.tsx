import React from 'react';
import { Key, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-6 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900 text-lg">API Configuration</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 p-1 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Enter API Key</label>
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500/50 transition-all">
          <Key size={16} className="text-orange-500 mr-3" />
          <input
            type="password"
            value={apiKey}
            onChange={onApiKeyChange}
            placeholder="Paste your API key here..."
            className="bg-transparent border-none text-sm w-full focus:outline-none text-slate-900 placeholder-slate-400 font-medium"
          />
        </div>
        <p className="mt-3 text-[10px] text-slate-500 leading-relaxed">
          Your key is stored locally in your browser and used to authenticate requests to the Travai backend.
        </p>
      </div>
    </div>
  );
};

export default SettingsModal;
