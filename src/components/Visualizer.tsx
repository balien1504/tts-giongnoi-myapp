import React, { useEffect, useRef } from 'react';
import { Activity, Volume2 } from 'lucide-react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  isRecording: boolean;
  rmsDb: number;
  peakDb: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  analyser,
  isPlaying,
  isRecording,
  rmsDb,
  peakDb,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      // Studio dark background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#04060a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Studio subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Idle animated resting wave when not playing
      if (!analyser || (!isPlaying && !isRecording)) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const t = performance.now() * 0.002;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.025 + t) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const timeData = new Float32Array(bufferLength);
      const freqData = new Uint8Array(bufferLength);
      analyser.getFloatTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);

      // 1. Draw Spectrum Frequency Bars (Lower section)
      const barCount = 56;
      const barWidth = width / barCount - 2;
      for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor(Math.pow(i / barCount, 1.7) * (bufferLength / 2.2));
        const val = freqData[dataIdx] || 0;
        const barHeight = (val / 255) * (height * 0.68);
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const barGrad = ctx.createLinearGradient(0, y, 0, height);
        barGrad.addColorStop(0, 'rgba(56, 189, 248, 0.75)'); // cyan
        barGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.55)'); // purple
        barGrad.addColorStop(1, 'rgba(15, 23, 42, 0.15)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      // 2. Draw Oscilloscope Glowing Waveform (Center)
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#0284c7';
      ctx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = timeData[i];
        const y = v * (height * 0.42) + height / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [analyser, isPlaying, isRecording]);

  // VU Meter normalization
  const clampRms = Math.max(-60, Math.min(0, rmsDb));
  const vuPercent = Math.max(0, Math.min(100, ((clampRms + 60) / 60) * 100));

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#06080d] shadow-2xl">
      {/* Visualizer Top Status HUD */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between text-xs pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/85 border border-slate-700/60 backdrop-blur-md">
            <span
              className={`w-2 h-2 rounded-full ${
                isRecording
                  ? 'bg-red-500 animate-ping'
                  : isPlaying
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <span className="font-mono text-slate-300 font-semibold tracking-wide">
              {isRecording ? 'REC LIVE' : isPlaying ? 'DSP PROCESSED' : 'STUDIO READY'}
            </span>
          </div>

          <span className="font-mono text-[11px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800 backdrop-blur-md hidden sm:inline">
            48kHz / 32-bit Float DSP
          </span>
        </div>

        {/* Real-time Level VU Bar */}
        <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-800 px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[11px] text-slate-300">
            {rmsDb > -55 ? `${rmsDb.toFixed(1)} dB` : '-- dB'}
          </span>
          <div className="w-20 sm:w-28 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                vuPercent > 88
                  ? 'bg-red-500'
                  : vuPercent > 70
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-emerald-500 to-sky-400'
              }`}
              style={{ width: `${vuPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <canvas ref={canvasRef} width={1000} height={180} className="w-full h-40 sm:h-44 block" />

      {/* Voice Frequency Bands Labels */}
      <div className="absolute bottom-1.5 left-4 right-4 flex justify-between text-[10px] font-mono text-slate-600 pointer-events-none select-none">
        <span>60Hz (Sub-Rumble)</span>
        <span>200Hz (Voice Warmth)</span>
        <span>850Hz (Clarity &amp; Body)</span>
        <span>3.5kHz (Presence)</span>
        <span>10kHz (Air &amp; Sheen)</span>
      </div>
    </div>
  );
};
