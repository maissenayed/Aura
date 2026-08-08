'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { RawExercise } from '@aura/types';
import { X, Plus, Trash2, Search, Link as LinkIcon, Sparkles, AlertCircle, Video } from 'lucide-react';

interface ExerciseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: RawExercise) => void;
  initialExercise: RawExercise | null;
  allExercises: RawExercise[];
}

interface FormValues {
  id: string;
  name: string;
  level: number;
  category: string;
  subCategory: string;
  stepsText: string;
  expertTip: string;
  youtubeQuery: string;
  videoSearchUrl: string;
}

export const ExerciseFormModal: React.FC<ExerciseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExercise,
  allExercises,
}) => {
  const isEditing = !!initialExercise;

  const [selectedPrereqs, setSelectedPrereqs] = useState<string[]>([]);
  const [prereqSearch, setPrereqSearch] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      id: '',
      name: '',
      level: 1,
      category: 'Pushing',
      subCategory: 'Pushups',
      stepsText: '',
      expertTip: '',
      youtubeQuery: '',
      videoSearchUrl: '',
    },
  });

  // Categories & SubCategories options
  const categoryOptions = ['Handstands', 'Pulling', 'Pushing', 'Miscellaneous', 'Other'];

  useEffect(() => {
    if (initialExercise) {
      setValue('id', initialExercise.id);
      setValue('name', initialExercise.name);
      setValue('level', initialExercise.level || 1);
      setValue('category', initialExercise.category || 'Pushing');
      setValue('subCategory', initialExercise.subCategory || 'Pushups');
      setValue('stepsText', (initialExercise.steps || []).join('\n'));
      setValue('expertTip', initialExercise.expertTip || '');
      setValue('youtubeQuery', initialExercise.youtubeQuery || '');
      setValue('videoSearchUrl', initialExercise.videoSearchUrl || '');
      setSelectedPrereqs(initialExercise.prerequisites || []);
    } else {
      // Create mode
      const nextIdNumber = Date.now().toString().slice(-4);
      setValue('id', `ex_custom_${nextIdNumber}`);
      setValue('name', '');
      setValue('level', 1);
      setValue('category', 'Pushing');
      setValue('subCategory', 'Pushups');
      setValue('stepsText', '');
      setValue('expertTip', '');
      setValue('youtubeQuery', '');
      setValue('videoSearchUrl', '');
      setSelectedPrereqs([]);
    }
    setPrereqSearch('');
  }, [initialExercise, setValue, isOpen]);

  if (!isOpen) return null;

  const togglePrereq = (id: string) => {
    setSelectedPrereqs(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const onSubmit = (data: FormValues) => {
    const steps = data.stepsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const updatedExercise: RawExercise = {
      id: data.id.trim() || `ex_${Date.now()}`,
      name: data.name.trim(),
      level: Number(data.level),
      category: data.category.trim(),
      subCategory: data.subCategory.trim(),
      prerequisites: selectedPrereqs,
      steps: steps.length > 0 ? steps : undefined,
      expertTip: data.expertTip.trim() || undefined,
      youtubeQuery: data.youtubeQuery.trim() || undefined,
      videoSearchUrl: data.videoSearchUrl.trim() || undefined,
    };

    onSave(updatedExercise);
    onClose();
  };

  // Filter available exercises for prerequisite picking (exclude current exercise)
  const availablePrereqExercises = allExercises.filter(ex => {
    if (initialExercise && ex.id === initialExercise.id) return false;
    if (!prereqSearch) return true;
    const q = prereqSearch.toLowerCase();
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.id.toLowerCase().includes(q) ||
      ex.subCategory.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-dark-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-dark-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? `Edit Exercise: ${initialExercise.name}` : 'Create New Exercise'}
              </h2>
              <p className="text-xs text-slate-400">Configure exercise parameters and prerequisite graph connections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Row 1: ID, Name, Level */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Exercise ID
              </label>
              <input
                {...register('id', { required: 'ID is required' })}
                disabled={isEditing}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono disabled:opacity-60 focus:outline-none focus:border-neon-cyan"
              />
              {errors.id && <p className="text-rose-400 text-[11px] mt-1">{errors.id.message}</p>}
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Exercise Name *
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                placeholder="e.g. One Arm Chinup"
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-cyan"
              />
              {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name.message}</p>}
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Level (1-20) *
              </label>
              <input
                type="number"
                min={1}
                max={20}
                {...register('level', { required: 'Level is required', min: 1, max: 20 })}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
              />
              {errors.level && <p className="text-rose-400 text-[11px] mt-1">{errors.level.message}</p>}
            </div>
          </div>

          {/* Row 2: Category & SubCategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
              >
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Sub-Category *
              </label>
              <input
                {...register('subCategory', { required: 'SubCategory is required' })}
                placeholder="e.g. Front Lever, Pushups"
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
              />
            </div>
          </div>

          {/* Video Configuration (Direct URL & Search Query) */}
          <div className="bg-dark-950/60 border border-slate-800/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-neon-cyan" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Video Tutorial Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Direct YouTube Video URL
                </label>
                <input
                  {...register('videoSearchUrl')}
                  placeholder="https://www.youtube.com/watch?v=r-aiCMOOhNQ"
                  className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-neon-cyan font-mono"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Direct YouTube link embedded into modal player</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  YouTube Search Query
                </label>
                <input
                  {...register('youtubeQuery')}
                  placeholder="e.g. Pushup form tutorial"
                  className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-neon-cyan"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Fallback YouTube search term</span>
              </div>
            </div>
          </div>

          {/* Prerequisite Node Graph Configurator */}
          <div className="bg-dark-950/60 border border-slate-800/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-neon-cyan" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Prerequisite Graph Connections (`prerequisites: ["ex_ID"]`)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {selectedPrereqs.length} selected
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Selected prerequisite nodes will draw directed arch lines in the Skill Tree canvas. The user will be required to master all selected prerequisite exercises before unlocking this node.
            </p>

            {/* Currently Selected Prereqs Badges */}
            {selectedPrereqs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedPrereqs.map(pId => {
                  const targetEx = allExercises.find(e => e.id === pId);
                  return (
                    <span
                      key={pId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 text-xs font-mono"
                    >
                      <span className="font-sans font-semibold text-slate-200">{targetEx ? targetEx.name : pId}</span>
                      <span className="text-[10px] text-slate-400">({pId})</span>
                      <button
                        type="button"
                        onClick={() => togglePrereq(pId)}
                        className="text-neon-cyan hover:text-rose-400 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Prerequisite Search & Selector */}
            <div className="space-y-2 pt-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={prereqSearch}
                  onChange={e => setPrereqSearch(e.target.value)}
                  placeholder="Search exercises to set as prerequisites..."
                  className="w-full bg-dark-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-neon-cyan"
                />
              </div>

              <div className="max-h-40 overflow-y-auto border border-slate-800/80 rounded-xl bg-dark-900/90 divide-y divide-slate-800/40">
                {availablePrereqExercises.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">No exercises found</div>
                ) : (
                  availablePrereqExercises.slice(0, 50).map(ex => {
                    const isSelected = selectedPrereqs.includes(ex.id);
                    return (
                      <div
                        key={ex.id}
                        onClick={() => togglePrereq(ex.id)}
                        className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-neon-cyan/10 text-neon-cyan font-bold'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-700 bg-dark-950 text-neon-cyan focus:ring-0"
                          />
                          <span>{ex.name}</span>
                          <span className="text-[10px] text-slate-500">Lvl {ex.level} • {ex.subCategory}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">{ex.id}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Steps */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Instructions / Steps (One per line)
            </label>
            <textarea
              {...register('stepsText')}
              rows={3}
              placeholder="e.g. Place hands shoulder width apart&#10;Keep body in a tight plank&#10;Lower chest under control"
              className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-neon-cyan"
            />
          </div>

          {/* Row 4: Expert Tip */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Expert Coaching Tip
            </label>
            <input
              {...register('expertTip')}
              placeholder="e.g. Keep elbows tucked at 45 degrees"
              className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-neon-cyan"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl border border-slate-800 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-dark-950 bg-gradient-to-r from-neon-cyan to-neon-emerald rounded-xl hover:brightness-110 shadow-neon-cyan transition"
            >
              <Sparkles className="w-4 h-4" />
              {isEditing ? 'Save Changes' : 'Create Exercise'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
