'use client';

import React, { useState } from 'react';
import { Key, ExternalLink, X, ShieldCheck } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
  currentKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaveKey,
  currentKey
}) => {
  const [keyInput, setKeyInput] = useState(currentKey);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      onSaveKey(keyInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Google Maps API Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm text-slate-300">
            This choropleth application renders interactive boundaries and demographic drill-downs using the 
            <strong className="text-white"> Google Maps JavaScript API</strong> Data layer.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Google Maps API Key
            </label>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 text-xs text-slate-400 space-y-1.5 border border-slate-700/50">
            <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How API Keys Are Handled:</span>
            </div>
            <p>
              • Keys are read from your environment variable <code className="text-emerald-300">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
            </p>
            <p>
              • Or you can enter your key here to store it in session storage for this browser session.
            </p>
            <a
              href="https://console.cloud.google.com/google/maps-apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-emerald-400 hover:underline pt-1"
            >
              <span>Get API key from Google Cloud Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shadow-lg shadow-emerald-900/40"
            >
              Save & Load Map
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

