'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { RawExercise } from '@aura/types';
import { getSwimlane } from '../data/exercisesData';
import {
  getRawExercises,
  saveExercise,
  deleteExercise as removeExerciseFromStorage,
  resetExercisesToDefault,
  importExercises,
} from '../utils/exerciseStorage';
import { ExerciseFormModal } from '../components/ExerciseFormModal';
import { JsonImportModal } from '../components/JsonImportModal';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  Link as LinkIcon,
  Flame,
  Shield,
  Dumbbell,
  Target,
  Filter,
  FileJson,
  Upload,
  Video,
  ExternalLink,
  Save,
  Download,
  CheckCircle2
} from 'lucide-react';

export default function AdminPage() {
  const [exercises, setExercises] = useState<RawExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSwimlane, setSelectedSwimlane] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<number>(20);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [editingExercise, setEditingExercise] = useState<RawExercise | null>(null);

  // Load raw exercises on mount
  useEffect(() => {
    setExercises(getRawExercises());
  }, []);

  const handleCreateNew = () => {
    setEditingExercise(null);
    setIsModalOpen(true);
  };

  const handleEdit = (ex: RawExercise) => {
    setEditingExercise(ex);
    setIsModalOpen(true);
  };

  const handleDuplicate = (ex: RawExercise) => {
    const nextIdNumber = Date.now().toString().slice(-4);
    const duplicated: RawExercise = {
      ...ex,
      id: `ex_custom_${nextIdNumber}`,
      name: `${ex.name} (Copy)`,
    };
    const updated = saveExercise(duplicated);
    setExercises(updated);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" (${id})? Any prerequisites pointing to this exercise will also be removed.`)) {
      const updated = removeExerciseFromStorage(id);
      setExercises(updated);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all exercise dataset changes and restore original exercises? This cannot be undone.')) {
      const defaults = resetExercisesToDefault();
      setExercises(defaults);
      setSyncMessage(null);
    }
  };

  const handleSaveModal = (savedExercise: RawExercise) => {
    const updated = saveExercise(savedExercise);
    setExercises(updated);
  };

  const handleImportModalSave = (importedExercises: RawExercise[], mode: 'merge' | 'replace') => {
    const updated = importExercises(importedExercises, mode);
    setExercises(updated);
  };

  // Sync current exercises state directly to rawExercisesData.ts source code file on disk
  const handleSyncToSourceCode = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/admin/save-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercises }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`✓ Synced ${data.count} exercises directly to rawExercisesData.ts!`);
      } else {
        setSyncMessage(`Sync failed: ${data.error}`);
      }
    } catch (e: any) {
      setSyncMessage(`Error syncing: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Export dataset as JSON file
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exercises, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rawExercisesData_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Categories list
  const categoriesList = ['All', 'Handstands', 'Pulling', 'Pushing', 'Miscellaneous', 'Other'];

  // Filter exercises
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch =
      searchQuery === '' ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.subCategory.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;

    const swimlane = getSwimlane(ex.category, ex.subCategory);
    const matchesSwimlane = selectedSwimlane === 'All' || swimlane === selectedSwimlane;

    const matchesLevel = ex.level <= selectedLevel;

    return matchesSearch && matchesCategory && matchesSwimlane && matchesLevel;
  });

  // Calculate statistics
  const totalCount = exercises.length;
  const pushCount = exercises.filter(e => getSwimlane(e.category, e.subCategory) === 'Push').length;
  const pullCount = exercises.filter(e => getSwimlane(e.category, e.subCategory) === 'Pull').length;
  const legsCount = exercises.filter(e => getSwimlane(e.category, e.subCategory) === 'Legs').length;
  const coreCount = exercises.filter(e => getSwimlane(e.category, e.subCategory) === 'Core').length;

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-neon-cyan selection:text-dark-950">
      
      {/* Navigation Header */}
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Banner Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-dark-900 via-dark-900 to-purple-950/40 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/50 text-purple-300 text-xs font-bold mb-3 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
                <span>Admin Skill Tree Editor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-neon-purple bg-clip-text text-transparent">
                Exercise Database & Prerequisite Manager
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Add, update, or delete exercises, configure custom video URLs (<span className="font-mono text-neon-cyan text-xs">videoSearchUrl</span>), and sync changes directly to <span className="font-mono text-neon-cyan text-xs">rawExercisesData.ts</span> source code!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleSyncToSourceCode}
                disabled={isSyncing}
                title="Persist all changes directly into src/data/rawExercisesData.ts code file"
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-dark-950 bg-gradient-to-r from-neon-emerald via-emerald-300 to-neon-cyan rounded-2xl hover:brightness-110 shadow-neon-emerald transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSyncing ? 'Syncing...' : 'Sync to Code (rawExercisesData.ts)'}</span>
              </button>

              <button
                onClick={handleExportJson}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-dark-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition shadow-lg"
              >
                <Download className="w-3.5 h-3.5 text-neon-cyan" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-800/60 hover:bg-purple-900/60 rounded-2xl transition shadow-lg"
              >
                <FileJson className="w-4 h-4 text-neon-purple" />
                <span>Import JSON</span>
              </button>

              <button
                onClick={handleResetToDefault}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-rose-400 bg-dark-950/80 border border-slate-800 hover:border-rose-900/60 rounded-2xl transition shadow-lg"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>

              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-dark-950 bg-gradient-to-r from-neon-cyan via-cyan-300 to-neon-emerald rounded-2xl hover:brightness-110 shadow-neon-cyan transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Exercise</span>
              </button>
            </div>
          </div>

          {/* Sync Success Feedback Notification */}
          {syncMessage && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-neon-emerald animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neon-emerald" />
                <span>{syncMessage}</span>
              </div>
              <button
                onClick={() => setSyncMessage(null)}
                className="text-emerald-400 hover:text-white text-xs font-mono"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-dark-950/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Exercises</span>
              <span className="text-xl font-black text-white">{totalCount}</span>
            </div>
            <div className="bg-dark-950/60 border border-cyan-950/60 rounded-2xl p-3">
              <span className="text-[11px] font-bold text-neon-cyan uppercase tracking-wider block flex items-center gap-1">
                <Flame className="w-3 h-3 text-neon-cyan" /> Push Branch
              </span>
              <span className="text-xl font-black text-white">{pushCount}</span>
            </div>
            <div className="bg-dark-950/60 border border-emerald-950/60 rounded-2xl p-3">
              <span className="text-[11px] font-bold text-neon-emerald uppercase tracking-wider block flex items-center gap-1">
                <Dumbbell className="w-3 h-3 text-neon-emerald" /> Pull Branch
              </span>
              <span className="text-xl font-black text-white">{pullCount}</span>
            </div>
            <div className="bg-dark-950/60 border border-purple-950/60 rounded-2xl p-3">
              <span className="text-[11px] font-bold text-neon-purple uppercase tracking-wider block flex items-center gap-1">
                <Shield className="w-3 h-3 text-neon-purple" /> Core & Statics
              </span>
              <span className="text-xl font-black text-white">{coreCount}</span>
            </div>
            <div className="bg-dark-950/60 border border-amber-950/60 rounded-2xl p-3 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                <Target className="w-3 h-3 text-amber-400" /> Legs & Lower
              </span>
              <span className="text-xl font-black text-white">{legsCount}</span>
            </div>
          </div>

        </div>

        {/* Filter Controls Toolbar */}
        <div className="bg-dark-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search exercise name, ID, or subcategory..."
              className="w-full bg-dark-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-cyan"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            
            {/* Category */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">Category:</span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-dark-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-neon-cyan"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Swimlane */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">Branch:</span>
              <select
                value={selectedSwimlane}
                onChange={e => setSelectedSwimlane(e.target.value)}
                className="bg-dark-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-neon-cyan"
              >
                <option value="All">All Branches</option>
                <option value="Push">Push</option>
                <option value="Pull">Pull</option>
                <option value="Core">Core</option>
                <option value="Legs">Legs</option>
              </select>
            </div>

            {/* Max Level Filter */}
            <div className="flex items-center gap-2 bg-dark-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold text-slate-400">Max Lvl:</span>
              <input
                type="range"
                min={1}
                max={20}
                value={selectedLevel}
                onChange={e => setSelectedLevel(Number(e.target.value))}
                className="w-20 accent-neon-cyan cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-neon-cyan">{selectedLevel}</span>
            </div>

            <span className="text-xs text-slate-500 font-medium ml-auto lg:ml-0">
              Showing {filteredExercises.length} / {exercises.length}
            </span>

          </div>

        </div>

        {/* Exercises Table */}
        <div className="bg-dark-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-950/80 border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Exercise Name</th>
                  <th className="py-3.5 px-4 text-center">Level</th>
                  <th className="py-3.5 px-4">Branch / Category</th>
                  <th className="py-3.5 px-4">Video Link / Query</th>
                  <th className="py-3.5 px-4">Prerequisites (`ex_ID`)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredExercises.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                      No exercises match your search filters.
                    </td>
                  </tr>
                ) : (
                  filteredExercises.map(ex => {
                    const swimlane = getSwimlane(ex.category, ex.subCategory);
                    
                    let badgeColor = 'bg-slate-800 text-slate-300';
                    if (swimlane === 'Push') badgeColor = 'bg-cyan-950/60 text-neon-cyan border-cyan-800/40';
                    else if (swimlane === 'Pull') badgeColor = 'bg-emerald-950/60 text-neon-emerald border-emerald-800/40';
                    else if (swimlane === 'Core') badgeColor = 'bg-purple-950/60 text-neon-purple border-purple-800/40';
                    else if (swimlane === 'Legs') badgeColor = 'bg-amber-950/60 text-amber-400 border-amber-800/40';

                    const prereqList = ex.prerequisites || [];

                    return (
                      <tr key={ex.id} className="hover:bg-dark-950/50 transition">
                        
                        {/* ID */}
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-400">
                          {ex.id}
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">{ex.name}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {ex.subCategory}
                          </span>
                        </td>

                        {/* Level */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-dark-950 border border-slate-800 font-mono font-black text-white">
                            {ex.level}
                          </span>
                        </td>

                        {/* Branch / Category */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${badgeColor}`}>
                            {swimlane} • {ex.category}
                          </span>
                        </td>

                        {/* Video Link / Search Query */}
                        <td className="py-3 px-4">
                          {ex.videoSearchUrl ? (
                            <a
                              href={ex.videoSearchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-[11px] font-medium hover:text-white hover:bg-red-900/40 transition truncate max-w-[180px]"
                            >
                              <Video className="w-3 h-3 text-red-400 shrink-0" />
                              <span className="truncate">Direct Video</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            </a>
                          ) : ex.youtubeQuery ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-950 border border-slate-800 text-slate-300 text-[11px] font-mono truncate max-w-[180px]">
                              <Video className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{ex.youtubeQuery}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600 italic">None</span>
                          )}
                        </td>

                        {/* Prerequisites */}
                        <td className="py-3 px-4">
                          {prereqList.length === 0 ? (
                            <span className="text-[11px] text-slate-600 italic">None (Root Node)</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {prereqList.map(pId => {
                                const parent = exercises.find(e => e.id === pId);
                                return (
                                  <span
                                    key={pId}
                                    title={parent ? `${parent.name} (${pId})` : pId}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-[10px] font-mono text-neon-cyan"
                                  >
                                    <LinkIcon className="w-2.5 h-2.5" />
                                    <span>{parent ? parent.name : pId}</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEdit(ex)}
                              title="Edit exercise & prerequisites"
                              className="p-1.5 text-slate-400 hover:text-neon-cyan rounded-lg hover:bg-slate-800 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDuplicate(ex)}
                              title="Duplicate exercise"
                              className="p-1.5 text-slate-400 hover:text-purple-300 rounded-lg hover:bg-slate-800 transition"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(ex.id, ex.name)}
                              title="Delete exercise"
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Modal Form */}
      <ExerciseFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialExercise={editingExercise}
        allExercises={exercises}
      />

      {/* JSON Import Modal */}
      <JsonImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportModalSave}
      />

    </div>
  );
}
