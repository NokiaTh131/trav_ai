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
    <div className="absolute top-16 right-4 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Configuration</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">API KEY</label>
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Key size={14} className="text-gray-400 mr-2" />
          <input
            type="password"
            value={apiKey}
            onChange={onApiKeyChange}
            placeholder="sk-..."
            className="bg-transparent border-none text-sm w-full focus:outline-none text-gray-800"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
