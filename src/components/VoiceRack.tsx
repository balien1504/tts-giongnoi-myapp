import React from 'react';
import { VoiceFilterSettings } from '../types/audio';
import {
  Sliders,
  ShieldCheck,
  Activity,
  Flame,
  Waves,
  Power,
  Sparkles,
  Scissors,
  Radio,
  Volume2,
} from 'lucide-react';

interface VoiceRackProps {
  settings: VoiceFilterSettings;
  onUpdateSettings: (newSettings: Partial<VoiceFilterSettings>) => void;
}

export const VoiceRack: React.FC<VoiceRackProps> = ({ settings, onUpdateSettings }) => {
  return (
    <div className="w-full space-y-4">
      {/* Rack Title & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-200">
            Dàn Bộ Lọc Âm Thanh Phòng Thu (Voice DSP Rack)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
          REAL-TIME 32-BIT FLOATING POINT DSP FILTERS
        </span>
      </div>

      {/* Grid of DSP Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* MODULE 1: NOISE GATE & LOW-CUT RUMBLE FILTER */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            settings.noiseGateEnabled
              ? 'bg-slate-900/80 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Lọc Tạp Âm &amp; Khử Tiếng Ồn</h3>
                <p className="text-[10px] text-slate-400">Smart Noise Gate &amp; Cắt Rung Đáy HPF</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ noiseGateEnabled: !settings.noiseGateEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.noiseGateEnabled
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt Bộ Lọc Tạp Âm"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Gate Threshold */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Ngưỡng Chặn Ồn (Threshold):</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {settings.noiseGateThreshold} dB
                </span>
              </div>
              <input
                type="range"
                min={-60}
                max={-15}
                step={1}
                value={settings.noiseGateThreshold}
                onChange={(e) => onUpdateSettings({ noiseGateThreshold: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-emerald-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Tự động ngắt tiếng gió, quạt máy, tạp âm khi người đọc dừng nói
              </span>
            </div>

            {/* Low-Cut Filter */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Cắt Âm Trầm Rung (Low-Cut HPF):</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {settings.lowCutFrequency} Hz
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={160}
                step={5}
                value={settings.lowCutFrequency}
                onChange={(e) => onUpdateSettings({ lowCutFrequency: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-emerald-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Triệt tiêu tiếng hơi thở mạnh vào mic, rung chân bàn &amp; ù đáy
              </span>
            </div>
          </div>
        </div>

        {/* MODULE 2: DE-ESSER (KHỬ TIẾNG CHÓI S, X, CH) */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            settings.deEsserEnabled
              ? 'bg-slate-900/80 border-sky-500/30 shadow-lg shadow-sky-950/20'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">De-Esser (Khử Chói Tai)</h3>
                <p className="text-[10px] text-slate-400">Làm Mượt Âm Gió S, X, CH, TR</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ deEsserEnabled: !settings.deEsserEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.deEsserEnabled
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt De-Esser"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Mức Độ Khử Chói (De-Ess Amount):</span>
                <span className="font-mono text-sky-400 font-semibold">{settings.deEsserAmount}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.deEsserAmount}
                onChange={(e) => onUpdateSettings({ deEsserAmount: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-sky-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Lọc tần số gắt 6.5kHz giúp giọng đọc êm tai khi nghe bằng tai nghe
              </span>
            </div>
          </div>
        </div>

        {/* MODULE 3: 4-BAND STUDIO SPEECH PARAMETRIC EQ */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            settings.eqEnabled
              ? 'bg-slate-900/80 border-amber-500/30 shadow-lg shadow-amber-950/20'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">4-Band Studio Voice EQ</h3>
                <p className="text-[10px] text-slate-400">Cân Bằng Âm Sắc Giọng Nói</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ eqEnabled: !settings.eqEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.eqEnabled
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt Bộ Cân Bằng EQ"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Low Warmth */}
            <div>
              <div className="flex justify-between text-slate-300 mb-0.5">
                <span className="text-slate-400">Trầm Ấm (Warmth 200Hz):</span>
                <span className="font-mono text-amber-400 font-semibold">
                  {settings.eqWarmth > 0 ? `+${settings.eqWarmth}` : settings.eqWarmth} dB
                </span>
              </div>
              <input
                type="range"
                min={-6}
                max={6}
                step={0.5}
                value={settings.eqWarmth}
                onChange={(e) => onUpdateSettings({ eqWarmth: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Mid Clarity */}
            <div>
              <div className="flex justify-between text-slate-300 mb-0.5">
                <span className="text-slate-400">Rõ Chữ (Clarity 850Hz):</span>
                <span className="font-mono text-amber-400 font-semibold">
                  {settings.eqClarity > 0 ? `+${settings.eqClarity}` : settings.eqClarity} dB
                </span>
              </div>
              <input
                type="range"
                min={-6}
                max={6}
                step={0.5}
                value={settings.eqClarity}
                onChange={(e) => onUpdateSettings({ eqClarity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-amber-400 cursor-pointer"
              />
            </div>

            {/* High-Mid Presence */}
            <div>
              <div className="flex justify-between text-slate-300 mb-0.5">
                <span className="text-slate-400">Sáng Tiếng (Presence 3.5kHz):</span>
                <span className="font-mono text-amber-400 font-semibold">
                  {settings.eqPresence > 0 ? `+${settings.eqPresence}` : settings.eqPresence} dB
                </span>
              </div>
              <input
                type="range"
                min={-6}
                max={6}
                step={0.5}
                value={settings.eqPresence}
                onChange={(e) => onUpdateSettings({ eqPresence: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Air Sheen */}
            <div>
              <div className="flex justify-between text-slate-300 mb-0.5">
                <span className="text-slate-400">Thoáng Khí (Air 10kHz):</span>
                <span className="font-mono text-amber-400 font-semibold">
                  {settings.eqAir > 0 ? `+${settings.eqAir}` : settings.eqAir} dB
                </span>
              </div>
              <input
                type="range"
                min={-4}
                max={8}
                step={0.5}
                value={settings.eqAir}
                onChange={(e) => onUpdateSettings({ eqAir: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* MODULE 4: BROADCAST DYNAMICS COMPRESSOR */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            settings.compressorEnabled
              ? 'bg-slate-900/80 border-purple-500/30 shadow-lg shadow-purple-950/20'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Broadcast Compressor</h3>
                <p className="text-[10px] text-slate-400">Kiểm Soát Độ Đều Âm Lượng</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ compressorEnabled: !settings.compressorEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.compressorEnabled
                  ? 'bg-purple-500 text-slate-950 border-purple-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt Compressor"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Threshold */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Ngưỡng Nén (Threshold):</span>
                <span className="font-mono text-purple-400 font-semibold">
                  {settings.compressorThreshold} dB
                </span>
              </div>
              <input
                type="range"
                min={-36}
                max={-10}
                step={1}
                value={settings.compressorThreshold}
                onChange={(e) =>
                  onUpdateSettings({ compressorThreshold: parseInt(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-purple-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Giữ giọng đọc luôn đầy đặn, không bị lúc quá to lúc quá nhỏ
              </span>
            </div>

            {/* Ratio */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Tỷ Lệ Nén (Ratio):</span>
                <span className="font-mono text-purple-400 font-semibold">
                  {settings.compressorRatio}:1
                </span>
              </div>
              <input
                type="range"
                min={1.5}
                max={8}
                step={0.5}
                value={settings.compressorRatio}
                onChange={(e) =>
                  onUpdateSettings({ compressorRatio: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-purple-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* MODULE 5: ANALOG TUBE SATURATION (ẤM ÁP ĐÈN) */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            settings.saturationEnabled
              ? 'bg-slate-900/80 border-rose-500/30 shadow-lg shadow-rose-950/20'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Analog Tube Saturation</h3>
                <p className="text-[10px] text-slate-400">Màu Âm Đèn Phòng Thu Cổ Điển</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ saturationEnabled: !settings.saturationEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.saturationEnabled
                  ? 'bg-rose-500 text-slate-950 border-rose-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt Saturation"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Độ Bão Hòa (Tube Drive):</span>
                <span className="font-mono text-rose-400 font-semibold">
                  {settings.saturationDrive}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={2}
                value={settings.saturationDrive}
                onChange={(e) => onUpdateSettings({ saturationDrive: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-rose-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Bổ sung hài âm tự nhiên giúp giọng đọc dày dặn, ấm áp và truyền cảm
              </span>
            </div>
          </div>
        </div>

        {/* MODULE 6: ROOM AMBIENCE & REVERB */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            settings.reverbEnabled
              ? 'bg-slate-900/80 border-cyan-500/30 shadow-lg shadow-cyan-950/20'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Không Gian Phòng Thu (Acoustics)</h3>
                <p className="text-[10px] text-slate-400">Studio Booth &amp; Reverb</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ reverbEnabled: !settings.reverbEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.reverbEnabled
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt Không Gian Phòng"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Room Type Selector */}
            <div className="flex gap-2 items-center">
              <span className="text-slate-400 whitespace-nowrap">Không Gian:</span>
              <div className="flex-1 grid grid-cols-4 gap-1">
                {(['Booth', 'PodcastRoom', 'Auditorium', 'Cathedral'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onUpdateSettings({ reverbType: type })}
                    className={`py-1 text-[11px] font-medium rounded-md border transition-all truncate ${
                      settings.reverbType === type
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type === 'Booth'
                      ? 'Cabin'
                      : type === 'PodcastRoom'
                      ? 'Podcast'
                      : type === 'Auditorium'
                      ? 'Hội Trường'
                      : 'Nhà Hát'}
                  </button>
                ))}
              </div>
            </div>

            {/* Reverb Wet Mix */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Độ Vang Phòng (Reverb Wet):</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {settings.reverbWet}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={45}
                step={2}
                value={settings.reverbWet}
                onChange={(e) => onUpdateSettings({ reverbWet: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
