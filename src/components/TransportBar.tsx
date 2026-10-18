import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Mic,
  Upload,
  Volume2,
  Headphones,
  RotateCcw,
  Sliders,
  Check,
} from 'lucide-react';

interface TransportBarProps {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  voiceGain: number;
  monitorMic: boolean;
  hasAudio: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onUploadAudioFile: (file: File) => void;
  onToggleMonitor: () => void;
  onChangeMasterVolume: (val: number) => void;
  onChangeVoiceGain: (val: number) => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  isRecording,
  currentTime,
  duration,
  masterVolume,
  voiceGain,
  monitorMic,
  hasAudio,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onStartRecord,
  onStopRecord,
  onUploadAudioFile,
  onToggleMonitor,
  onChangeMasterVolume,
  onChangeVoiceGain,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      setRecordDuration(0);
      interval = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAudioFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
      {/* Top Track Scrubber */}
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-xs text-sky-400 w-16 text-right select-none font-semibold">
          {formatTime(currentTime)}
        </span>

        <div className="relative flex-1 flex items-center group">
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 100}
            step={0.05}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            disabled={duration <= 0}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none transition-all group-hover:h-2.5"
          />
        </div>

        <span className="font-mono text-xs text-slate-500 w-16 select-none font-medium">
          {formatTime(duration)}
        </span>
      </div>

      {/* Main Transport Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Side: Recording & Uploading options */}
        <div className="flex items-center gap-2">
          {/* Record Live Voice Button */}
          <button
            onClick={isRecording ? onStopRecord : onStartRecord}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse ring-4 ring-red-500/30'
                : 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30'
            }`}
          >
            <Mic className={`w-4 h-4 ${isRecording ? 'animate-bounce' : ''}`} />
            <span>{isRecording ? `Dừng Thu (${recordDuration}s)` : 'Ghi Âm Micro'}</span>
          </button>

          {/* Upload Audio File */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors"
            title="Tải lên file âm thanh giọng đọc có sẵn (MP3, WAV, M4A, OGG)"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Tải File Giọng Đọc</span>
          </button>
        </div>

        {/* Center: Play / Pause / Stop */}
        <div className="flex items-center gap-2 mx-auto">
          <button
            onClick={onStop}
            disabled={!hasAudio}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Dừng và quay về đầu"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={!hasAudio}
            className={`p-4 rounded-2xl font-bold transition-all shadow-xl flex items-center justify-center ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-4 ring-amber-500/25'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950 ring-4 ring-sky-500/25 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
            title={isPlaying ? 'Tạm dừng' : 'Phát âm thanh với bộ lọc DSP'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Right Side: Monitoring & Levels */}
        <div className="flex items-center gap-4">
          {/* Headphone Live Monitor */}
          <button
            onClick={onToggleMonitor}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              monitorMic
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'
            }`}
            title="Nghe trực tiếp tiếng micro qua tai nghe để kiểm tra bộ lọc"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Kiểm Âm</span>
            {monitorMic && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          {/* Voice Gain Level */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">Voice:</span>
            <input
              type="range"
              min={0}
              max={1.8}
              step={0.05}
              value={voiceGain}
              onChange={(e) => onChangeVoiceGain(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none accent-sky-400 cursor-pointer"
              title="Độ khuếch đại giọng đọc"
            />
          </div>

          {/* Master Volume */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={masterVolume}
              onChange={(e) => onChangeMasterVolume(parseFloat(e.target.value))}
              className="w-16 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none accent-sky-400 cursor-pointer"
              title="Tổng âm lượng Master"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
