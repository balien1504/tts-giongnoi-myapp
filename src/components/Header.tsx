import React from 'react';
import { Volume2, Sparkles, Download, RotateCcw, Activity, Key, Check } from 'lucide-react';

interface HeaderProps {
  onOpenScriptModal: () => void;
  onOpenExportModal: () => void;
  onOpenApiKeyModal: () => void;
  onResetFilters: () => void;
  hasAudio: boolean;
  activeFilterPresetName: string;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenScriptModal,
  onOpenExportModal,
  onOpenApiKeyModal,
  onResetFilters,
  hasAudio,
  activeFilterPresetName,
  hasApiKey,
}) => {
  return (
    <header className="w-full flex flex-wrap items-center justify-between gap-4 py-3.5 px-4 sm:px-6 bg-slate-900/70 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-2xl">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
          <Activity className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
              VoiceStudio AI
            </h1>
            <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 uppercase font-semibold">
              Speech &amp; TTS Master
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Chuyển Text thành giọng nói biểu cảm đa dạng &amp; Bộ lọc âm thanh phòng thu chuyên nghiệp
          </p>
        </div>
      </div>

      {/* Top Action Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
        {/* Reset settings button */}
        <button
          onClick={onResetFilters}
          className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-xs flex items-center gap-1.5 shadow-sm"
          title="Đặt lại thông số bộ lọc mặc định"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Đặt Lại DSP</span>
        </button>

        {/* API Key Configuration Button */}
        <button
          onClick={onOpenApiKeyModal}
          className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
            hasApiKey
              ? 'bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
              : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 animate-pulse'
          }`}
          title={hasApiKey ? 'Cài đặt / Thay đổi Gemini API Key cá nhân' : 'Bấm để nhập API Key cá nhân'}
        >
          <Key className="w-4 h-4 text-amber-400" />
          <span className="flex items-center gap-1.5">
            {hasApiKey ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>API Key: Đã lưu</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Nhập API Key</span>
              </>
            )}
          </span>
        </button>

        {/* AI Script Writer */}
        <button
          onClick={onOpenScriptModal}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Kịch Bản AI</span>
        </button>

        {/* Export Master Audio */}
        <button
          onClick={onOpenExportModal}
          disabled={!hasAudio}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 shadow-lg shadow-sky-500/25 transition-all"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Xuất File Âm Thanh</span>
        </button>
      </div>
    </header>
  );
};
