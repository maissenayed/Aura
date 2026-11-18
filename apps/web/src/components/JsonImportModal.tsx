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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-ink-900 border border-ink-700 rounded-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-700 bg-ink-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-card bg-armour-deep/60 border border-armour-deep/50 text-armour">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-fg">Import Exercise JSON Dataset</h2>
              <p className="text-xs text-fg-4">Bulk import or update exercises with custom prerequisites and YouTube links</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-fg-4 hover:text-fg rounded-card hover:bg-ink-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          
          {/* Import Mode Options */}
          <div className="flex items-center gap-4 bg-ink-950/60 border border-ink-700 rounded-card p-3">
            <span className="eyebrow text-fg-3">Import Mode:</span>
            
            <label className="flex items-center gap-2 text-xs text-fg-2 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="accent-act"
              />
              <span className="font-semibold">Merge & Update</span>
              <span className="text-[10px] text-fg-5">(Updates existing IDs, adds new ones)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-fg-2 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="accent-act"
              />
              <span className="font-semibold text-boss">Replace All</span>
              <span className="text-[10px] text-fg-5">(Overwrites dataset completely)</span>
            </label>
          </div>

          {/* Textarea */}
          <div>
            <label className="eyebrow block text-fg-3 mb-2">
              Paste JSON Data Below
            </label>
            <textarea
              rows={12}
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder={`[\n  {\n    "id": "tuck-back-lever",\n    "name": "Tuck Back Lever",\n    "level": 1,\n    "category": "Horizontal Pull",\n    "subCategory": "Tuck Back Lever",\n    "prerequisites": ["german-hang"],\n    "youtubeQuery": "Tuck Back Lever tutorial",\n    "videoSearchUrl": "https://www.youtube.com/watch?v=..."\n  }\n]`}
              className="w-full bg-ink-950 border border-ink-700 rounded-card p-4 text-xs font-mono text-fg-2 placeholder-fg-5 focus:outline-none focus:border-act"
            />
          </div>

          {/* Status Feedback */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-card bg-boss-deep/50 border border-boss-line/60 text-boss-soft text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-card bg-earned-deep/50 border border-earned-line/60 text-earned-soft text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-earned" />
              <span>{successMessage}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink-700 bg-ink-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-fg-4 hover:text-fg rounded-card border border-ink-700 hover:bg-ink-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessImport}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-ink-950 bg-gradient-to-r from-armour via-armour to-act rounded-card hover:brightness-110 shadow-armour transition"
          >
            <Upload className="w-4 h-4" />
            <span>Process & Save Import</span>
          </button>
        </div>

      </div>
    </div>
  );
};
