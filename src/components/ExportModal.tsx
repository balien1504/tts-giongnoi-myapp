import React, { useState } from 'react';
import { ExportAudioFormat } from '../types/audio';
import {
  Download,
  X,
  CheckCircle,
  Loader2,
  Sparkles,
  FileAudio,
  Check,
  Disc,
  Radio,
  Sliders,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (
    filename: string,
    format: ExportAudioFormat,
    sampleRate: number,
    normalize: boolean
  ) => Promise<void>;
  isExporting: boolean;
  exportProgress: number;
  durationSeconds: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting,
  exportProgress,
  durationSeconds,
}) => {
  const [fileName, setFileName] = useState('VoiceStudio_Master_BanThu');
  const [selectedFormat, setSelectedFormat] = useState<ExportAudioFormat>('mp3-320');
  const [sampleRate, setSampleRate] = useState<number>(48000);
  const [normalize, setNormalize] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleExportClick = async () => {
    const cleanName = fileName.trim() || 'VoiceStudio_Audio';
    await onExport(cleanName, selectedFormat, sampleRate, normalize);
  };

  const getFormatBadge = (fmt: ExportAudioFormat) => {
    switch (fmt) {
      case 'wav-24':
        return {
          title: 'WAV 24-bit Hi-Res Master',
          desc: 'Lossless Linear PCM không nén, độ phân giải cao 24-bit phòng thu đỉnh cao',
          ext: '.wav',
          badge: 'Hi-Res Lossless',
        };
      case 'wav-16':
        return {
          title: 'WAV 16-bit Broadcast',
          desc: 'Tiêu chuẩn quốc tế 16-bit PCM Linear, tương thích 100% mọi đài phát thanh',
          ext: '.wav',
          badge: 'Broadcast Studio',
        };
      case 'mp3-320':
        return {
          title: 'MP3 320 kbps (High Quality)',
          desc: 'Bitrate cao nhất của chuẩn MP3, âm sắc tròn trịa, dung lượng tối ưu',
          ext: '.mp3',
          badge: '320 kbps HQ',
        };
      case 'mp3-256':
        return {
          title: 'MP3 256 kbps (Streaming)',
          desc: 'Chất lượng cao tiêu chuẩn podcast trực tuyến',
          ext: '.mp3',
          badge: '256 kbps',
        };
      case 'mp3-128':
        return {
          title: 'MP3 128 kbps (Tiết Kiệm)',
          desc: 'Dung lượng nhẹ, phù hợp gửi qua Zalo, Messenger, WhatsApp',
          ext: '.mp3',
          badge: '128 kbps',
        };
      case 'webm':
        return {
          title: 'WebM Opus Audio',
          desc: 'Chuẩn âm thanh web hiện đại thế hệ mới của Google',
          ext: '.webm',
          badge: 'Web Ready',
        };
    }
  };

  const currentBadge = getFormatBadge(selectedFormat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0a0e16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Xuất File Âm Thanh Chất Lượng Cao</h2>
              <p className="text-xs text-slate-400">
                Xuất file đã qua xử lý lọc âm DSP với nhiều định dạng cao cấp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          {/* File Name */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Tên File Âm Thanh:</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Nhap_Ten_File_Am_Thanh"
                className="flex-1 bg-transparent text-slate-100 focus:outline-none font-mono text-xs"
              />
              <span className="font-mono text-sky-400 text-xs font-semibold">
                {currentBadge.ext}
              </span>
            </div>
          </div>

          {/* Formats Selection */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">
              Chọn Định Dạng Xuất File (Format):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  'wav-24',
                  'wav-16',
                  'mp3-320',
                  'mp3-256',
                  'mp3-128',
                  'webm',
                ] as ExportAudioFormat[]
              ).map((fmt) => {
                const info = getFormatBadge(fmt);
                const isSelected = selectedFormat === fmt;
                return (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400 text-sky-200 ring-1 ring-sky-400 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-xs text-slate-200 truncate">
                        {info.title}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {info.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sample Rate & Normalization Options */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Sample Rate */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">
                Tần Số Lấy Mẫu (Sample Rate):
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[48000, 44100].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setSampleRate(rate)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium border text-center transition-all ${
                      sampleRate === rate
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {rate === 48000 ? '48.0 kHz' : '44.1 kHz'}
                  </button>
                ))}
              </div>
            </div>

            {/* Normalization */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Chuẩn Hóa Âm Lượng:</label>
              <button
                onClick={() => setNormalize(!normalize)}
                className={`w-full py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                  normalize
                    ? 'bg-purple-500/20 border-purple-500/60 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${normalize ? 'opacity-100' : 'opacity-0'}`} />
                <span>Peak -0.5 dB True</span>
              </button>
            </div>
          </div>

          {/* Format Highlights Info Box */}
          <div className="p-3 bg-sky-950/20 border border-sky-800/40 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentBadge.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{currentBadge.desc}</p>
          </div>

          {/* Rendering Progress */}
          {isExporting && (
            <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
              <div className="flex justify-between text-xs text-sky-400 font-mono">
                <span>Đang render &amp; mã hóa âm thanh chất lượng cao...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 transition-all duration-150"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={handleExportClick}
            disabled={isExporting}
            className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-sky-500/20"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Đang Xuất File Âm Thanh...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Tải File Âm Thanh Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
