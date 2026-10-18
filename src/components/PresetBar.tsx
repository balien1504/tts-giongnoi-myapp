import React, { useState } from 'react';
import { FilterPreset, VoiceFilterSettings } from '../types/audio';
import { Sparkles, Wand2, Check, Loader2, Mic2, Radio, BookOpen, Film, ShieldCheck, Volume2 } from 'lucide-react';

interface PresetBarProps {
  presets: FilterPreset[];
  activePresetId: string;
  onSelectPreset: (preset: FilterPreset) => void;
  onApplyCustomAIPreset: (description: string) => Promise<void>;
  isLoadingAI: boolean;
}

const getPresetIcon = (iconName: string) => {
  switch (iconName) {
    case 'Mic2':
      return <Mic2 className="w-3.5 h-3.5 text-sky-400" />;
    case 'Radio':
      return <Radio className="w-3.5 h-3.5 text-amber-400" />;
    case 'BookOpen':
      return <BookOpen className="w-3.5 h-3.5 text-purple-400" />;
    case 'Film':
      return <Film className="w-3.5 h-3.5 text-indigo-400" />;
    case 'ShieldCheck':
      return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
    case 'Volume2':
      return <Volume2 className="w-3.5 h-3.5 text-rose-400" />;
    default:
      return <Sparkles className="w-3.5 h-3.5 text-sky-400" />;
  }
};

export const PresetBar: React.FC<PresetBarProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onApplyCustomAIPreset,
  isLoadingAI,
}) => {
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleSubmitAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    await onApplyCustomAIPreset(aiPrompt);
    setShowAIPrompt(false);
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Cấu Hình Bộ Lọc Phòng Thu Mẫu (1-Click Studio Presets)
          </h3>
        </div>

        <button
          onClick={() => setShowAIPrompt(!showAIPrompt)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-500/20 to-sky-500/20 hover:from-purple-500/30 hover:to-sky-500/30 text-purple-300 border border-purple-500/30 transition-all shadow-sm"
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Tự Thiết Kế Bộ Lọc</span>
        </button>
      </div>

      {/* AI Custom Filter Generator */}
      {showAIPrompt && (
        <form
          onSubmit={handleSubmitAI}
          className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-xl flex flex-wrap gap-2 items-center animate-in fade-in duration-200"
        >
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ví dụ: Giọng đọc podcast đêm muộn, rất trầm ấm, không gian phòng nhỏ ấm cúng, khử ồn sạch..."
            className="flex-1 min-w-[260px] bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
          />

          <button
            type="submit"
            disabled={isLoadingAI || !aiPrompt.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md"
          >
            {isLoadingAI ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI Đang Cân Chỉnh Rack...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Áp Dụng Cho Dàn Lọc</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {presets.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs relative ${
                isActive
                  ? 'bg-sky-500/15 border-sky-500/50 text-sky-200 shadow-md ring-1 ring-sky-500/30'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5 truncate">
                  {getPresetIcon(preset.icon)}
                  <span className="font-semibold text-slate-100 truncate">{preset.name}</span>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 ml-1" />}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 leading-tight">
                {preset.subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
