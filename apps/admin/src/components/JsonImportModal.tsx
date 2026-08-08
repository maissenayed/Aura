'use client';

import React, { useState } from 'react';
import { RawExercise } from '@aura/types';
import { X, Upload, FileJson, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (importedExercises: RawExercise[], mode: 'merge' | 'replace') => void;
}

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessImport = () => {
    setError(null);
    setSuccessMessage(null);

    if (!jsonText.trim()) {
      setError('Please paste JSON exercise data into the input field.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);

      if (!Array.isArray(parsed)) {
        setError('JSON must be an array of exercise objects (e.g. [{"id": "...", "name": "..."}]).');
        return;
      }

      // Validate objects in array
      const validExercises: RawExercise[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item.name || typeof item.name !== 'string') {
          setError(`Item at index ${i} is missing a valid "name" property.`);
          return;
        }

        const validItem: RawExercise = {
          id: item.id ? String(item.id) : `ex_import_${Date.now()}_${i}`,
          name: String(item.name),
          level: typeof item.level === 'number' ? item.level : 1,
          category: item.category ? String(item.category) : 'Pushing',
          subCategory: item.subCategory ? String(item.subCategory) : String(item.category || 'General'),
          prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites.map(String) : undefined,
          steps: Array.isArray(item.steps) ? item.steps.map(String) : undefined,
          expertTip: item.expertTip ? String(item.expertTip) : undefined,
          youtubeQuery: item.youtubeQuery ? String(item.youtubeQuery) : undefined,
          videoSearchUrl: item.videoSearchUrl ? String(item.videoSearchUrl) : undefined,
        };

        validExercises.push(validItem);
      }

      onImport(validExercises, importMode);
      setSuccessMessage(`Successfully processed ${validExercises.length} exercises!`);
      setTimeout(() => {
        setSuccessMessage(null);
        setJsonText('');
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(`JSON Parsing Error: ${err.message || 'Invalid JSON format.'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-dark-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-dark-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/50 text-neon-purple">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Import Exercise JSON Dataset</h2>
              <p className="text-xs text-slate-400">Bulk import or update exercises with custom prerequisites and YouTube links</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          
          {/* Import Mode Options */}
          <div className="flex items-center gap-4 bg-dark-950/60 border border-slate-800 rounded-2xl p-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Import Mode:</span>
            
            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="accent-neon-cyan"
              />
              <span className="font-semibold">Merge & Update</span>
              <span className="text-[10px] text-slate-500">(Updates existing IDs, adds new ones)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="accent-neon-cyan"
              />
              <span className="font-semibold text-rose-400">Replace All</span>
              <span className="text-[10px] text-slate-500">(Overwrites dataset completely)</span>
            </label>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Paste JSON Data Below
            </label>
            <textarea
              rows={12}
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder={`[\n  {\n    "id": "tuck-back-lever",\n    "name": "Tuck Back Lever",\n    "level": 1,\n    "category": "Horizontal Pull",\n    "subCategory": "Tuck Back Lever",\n    "prerequisites": ["german-hang"],\n    "youtubeQuery": "Tuck Back Lever tutorial",\n    "videoSearchUrl": "https://www.youtube.com/watch?v=..."\n  }\n]`}
              className="w-full bg-dark-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-neon-cyan"
            />
          </div>

          {/* Status Feedback */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-neon-emerald" />
              <span>{successMessage}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-dark-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl border border-slate-800 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessImport}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-dark-950 bg-gradient-to-r from-neon-purple via-purple-300 to-neon-cyan rounded-xl hover:brightness-110 shadow-neon-purple transition"
          >
            <Upload className="w-4 h-4" />
            <span>Process & Save Import</span>
          </button>
        </div>

      </div>
    </div>
  );
};
