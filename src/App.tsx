import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from './services/audioEngine';
import {
  DEFAULT_FILTER_SETTINGS,
  VOICE_EMOTIONS,
  TTS_VOICES,
  FILTER_PRESETS,
  SAMPLE_TEXTS,
} from './services/voicePresets';
import { generateSpeechAudio } from './services/ttsService';
import {
  VoiceFilterSettings,
  VoiceEmotionId,
  TTSVoiceOption,
  FilterPreset,
  ExportAudioFormat,
} from './types/audio';
import { Header } from './components/Header';
import { Visualizer } from './components/Visualizer';
import { TransportBar } from './components/TransportBar';
import { TTSPanel } from './components/TTSPanel';
import { PresetBar } from './components/PresetBar';
import { VoiceRack } from './components/VoiceRack';
import { ExportModal } from './components/ExportModal';
import { AIScriptModal } from './components/AIScriptModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { hasStoredApiKey, getStoredApiKey } from './services/apiKeyStorage';

export default function App() {
  const engineRef = useRef<AudioEngine | null>(null);

  // Text & TTS parameters state
  const [text, setText] = useState<string>(SAMPLE_TEXTS[0].text);
  const [selectedEmotionId, setSelectedEmotionId] = useState<VoiceEmotionId>('warm');
  const [selectedVoice, setSelectedVoice] = useState<TTSVoiceOption>(TTS_VOICES[0]);
  const [customStyle, setCustomStyle] = useState<string>('');
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState<boolean>(false);

  // Audio Engine DSP filter settings
  const [settings, setSettings] = useState<VoiceFilterSettings>(DEFAULT_FILTER_SETTINGS);
  const [activePresetId, setActivePresetId] = useState<string>('podcast-master');

  // Playback & Recording state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [hasAudio, setHasAudio] = useState<boolean>(false);
  const [audioMetrics, setAudioMetrics] = useState({ rmsDb: -60, peakDb: -60 });

  // Modals & API Key state
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(hasStoredApiKey());
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isLoadingAIFilter, setIsLoadingAIFilter] = useState<boolean>(false);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Get or initialize AudioEngine
  const getOrCreateEngine = useCallback(() => {
    if (!engineRef.current) {
      const engine = new AudioEngine(settings);
      engine.onPlaybackEnd = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      engine.onRecordingComplete = (buffer) => {
        setHasAudio(true);
        setDuration(engine.getDuration());
        showToast('Ghi âm thành công! Bạn có thể chỉnh bộ lọc âm thanh và nghe lại.');
      };
      engine.onAudioMetricsUpdate = (metrics) => {
        setAudioMetrics(metrics);
      };
      engineRef.current = engine;
    }
    return engineRef.current;
  }, [settings]);

  // Request Animation Frame loop for smooth time updates
  useEffect(() => {
    let animId: number;
    const updateProgress = () => {
      if (engineRef.current) {
        setCurrentTime(engineRef.current.getCurrentTime());
        setIsPlaying(engineRef.current.getIsPlaying());
        setIsRecording(engineRef.current.getIsRecording());
      }
      animId = requestAnimationFrame(updateProgress);
    };
    animId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Update Settings handler
  const handleUpdateSettings = (newSettings: Partial<VoiceFilterSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (engineRef.current) {
        engineRef.current.applySettings(updated);
      }
      return updated;
    });
  };

  // Apply Filter Preset
  const handleSelectPreset = (preset: FilterPreset) => {
    setActivePresetId(preset.id);
    handleUpdateSettings(preset.settings);
    showToast(`Đã áp dụng bộ lọc: ${preset.name}`);
  };

  // Select Voice Persona with optional DSP preset recommendation
  const handleSelectVoice = (voice: TTSVoiceOption) => {
    setSelectedVoice(voice);
    if (voice.recommendedPresetId) {
      const matched = FILTER_PRESETS.find((p) => p.id === voice.recommendedPresetId);
      if (matched) {
        setActivePresetId(matched.id);
        handleUpdateSettings(matched.settings);
      }
    }
    showToast(`Đã chọn nhân vật: ${voice.name}`);
  };

  // AI Master Sound Engineer preset
  const handleApplyCustomAIPreset = async (description: string) => {
    setIsLoadingAIFilter(true);
    const storedApiKey = getStoredApiKey();
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedApiKey) {
        headers['x-gemini-api-key'] = storedApiKey;
      }
      const res = await fetch('/api/ai-filter-preset', {
        method: 'POST',
        headers,
        body: JSON.stringify({ description, apiKey: storedApiKey }),
      });
      const data = await res.json();
      if (data?.settings) {
        handleUpdateSettings(data.settings);
        showToast(`AI đã thiết lập bộ lọc: ${data.name || description}`);
      }
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi thiết kế bộ lọc AI. Vui lòng thử lại.');
    } finally {
      setIsLoadingAIFilter(false);
    }
  };

  // Generate Speech from Text with Emotion
  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      showToast('Vui lòng nhập nội dung văn bản');
      return;
    }

    const currentApiKey = getStoredApiKey();
    if (!hasApiKey && !currentApiKey) {
      setIsApiKeyModalOpen(true);
      showToast('Vui lòng nhập Gemini API Key cá nhân của bạn để tạo giọng nói AI');
      return;
    }

    setIsGeneratingSpeech(true);
    try {
      const engine = getOrCreateEngine();
      await engine.init();
      const audioCtx = (engine as any).ctx as AudioContext;

      const result = await generateSpeechAudio({
        text,
        emotionId: selectedEmotionId,
        voice: selectedVoice,
        customStyle,
        audioCtx,
      });

      engine.setVoiceBuffer(result.audioBuffer);
      setHasAudio(true);
      setDuration(engine.getDuration());

      const emotion = VOICE_EMOTIONS.find((e) => e.id === selectedEmotionId);
      showToast(
        `Đã tạo giọng nói thành công (${emotion?.name})! Đang phát thử nghiệm qua bộ lọc phòng thu...`
      );

      // Automatically play the newly synthesized speech through the DSP rack
      await engine.play();
      setIsPlaying(true);
    } catch (error: any) {
      console.error('Speech generation failed:', error);
      if (error?.message === 'NO_API_KEY') {
        setIsApiKeyModalOpen(true);
        showToast('Vui lòng nhập API Key cá nhân của bạn để sử dụng TTS');
      } else {
        showToast(`Lỗi tạo giọng nói: ${error.message || 'Không thể tạo âm thanh'}`);
      }
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  // Playback handlers
  const handlePlay = async () => {
    const engine = getOrCreateEngine();
    await engine.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (timeSecs: number) => {
    if (engineRef.current) {
      engineRef.current.seek(timeSecs);
      setCurrentTime(timeSecs);
    }
  };

  // Recording handlers
  const handleStartRecord = async () => {
    try {
      const engine = getOrCreateEngine();
      await engine.startRecording();
      setIsRecording(true);
      showToast('Đang thu âm qua Micro! Hãy bắt đầu nói...');
    } catch (err) {
      console.error(err);
      showToast('Không thể truy cập Microphone. Vui lòng cấp quyền trong trình duyệt.');
    }
  };

  const handleStopRecord = () => {
    if (engineRef.current) {
      engineRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  // Direct Headphone Monitoring
  const handleToggleMonitor = async () => {
    const engine = getOrCreateEngine();
    const nextVal = !settings.monitorMic;
    handleUpdateSettings({ monitorMic: nextVal });
    if (nextVal) {
      try {
        await engine.startMicMonitoring();
        showToast('Bật kiểm âm tai nghe trực tiếp (Khuyến nghị đeo tai nghe).');
      } catch (e) {
        showToast('Không thể kích hoạt kiểm âm. Vui lòng cho phép quyền micro.');
      }
    } else {
      engine.stopMicMonitoring();
      showToast('Đã tắt kiểm âm trực tiếp.');
    }
  };

  // Upload Audio File
  const handleUploadAudio = async (file: File) => {
    try {
      const engine = getOrCreateEngine();
      await engine.decodeAudioFile(file);
      setHasAudio(true);
      setDuration(engine.getDuration());
      showToast(`Đã tải file âm thanh: ${file.name}`);
    } catch (e) {
      console.error(e);
      showToast('Không thể đọc file âm thanh. Vui lòng thử định dạng MP3, WAV hoặc M4A.');
    }
  };

  // Reset Filters to default
  const handleResetFilters = () => {
    setSettings(DEFAULT_FILTER_SETTINGS);
    setActivePresetId('podcast-master');
    if (engineRef.current) {
      engineRef.current.applySettings(DEFAULT_FILTER_SETTINGS);
    }
    showToast('Đã đặt lại thông số bộ lọc mặc định.');
  };

  // Multi-Format Audio Exporter
  const handleExportAudio = async (
    filename: string,
    format: ExportAudioFormat,
    sampleRate: number,
    normalize: boolean
  ) => {
    if (!engineRef.current) return;
    setIsExporting(true);
    setExportProgress(15);

    try {
      const result = await engineRef.current.exportMasterAudio(
        format,
        sampleRate,
        normalize,
        (pct) => setExportProgress(pct)
      );

      // Create download link
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename.replace(/\.[^/.]+$/, '')}.${result.ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Xuất file ${result.ext.toUpperCase()} thành công!`);
      setIsExportModalOpen(false);
    } catch (e: any) {
      console.error('Export error:', e);
      showToast(`Lỗi xuất file âm thanh: ${e.message || 'Thao tác không thành công'}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#040609] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-black">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-sky-500/50 text-sky-200 text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top duration-200 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-5 flex-1">
        {/* Header */}
        <Header
          onOpenScriptModal={() => setIsScriptModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          onResetFilters={handleResetFilters}
          hasAudio={hasAudio}
          activeFilterPresetName={activePresetId}
          hasApiKey={hasApiKey}
        />

        {/* Visualizer & Oscilloscope */}
        <Visualizer
          analyser={engineRef.current?.getMasterAnalyser() || null}
          isPlaying={isPlaying}
          isRecording={isRecording}
          rmsDb={audioMetrics.rmsDb}
          peakDb={audioMetrics.peakDb}
        />

        {/* Text-to-Speech Studio with Emotional States & Voice Catalog */}
        <TTSPanel
          text={text}
          onChangeText={setText}
          selectedEmotionId={selectedEmotionId}
          onSelectEmotion={setSelectedEmotionId}
          selectedVoice={selectedVoice}
          onSelectVoice={handleSelectVoice}
          customStyle={customStyle}
          onChangeCustomStyle={setCustomStyle}
          onGenerateSpeech={handleGenerateSpeech}
          isGenerating={isGeneratingSpeech}
          hasAudio={hasAudio}
          onPlayCurrent={handlePlay}
          isPlaying={isPlaying}
          hasApiKey={hasApiKey}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        />

        {/* Transport Bar Player & Recorder */}
        <TransportBar
          isPlaying={isPlaying}
          isRecording={isRecording}
          currentTime={currentTime}
          duration={duration}
          masterVolume={settings.masterVolume}
          voiceGain={settings.voiceGain}
          monitorMic={settings.monitorMic}
          hasAudio={hasAudio}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onSeek={handleSeek}
          onStartRecord={handleStartRecord}
          onStopRecord={handleStopRecord}
          onUploadAudioFile={handleUploadAudio}
          onToggleMonitor={handleToggleMonitor}
          onChangeMasterVolume={(vol) => handleUpdateSettings({ masterVolume: vol })}
          onChangeVoiceGain={(gain) => handleUpdateSettings({ voiceGain: gain })}
        />

        {/* 1-Click Studio Speech Filter Presets */}
        <PresetBar
          presets={FILTER_PRESETS}
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          onApplyCustomAIPreset={handleApplyCustomAIPreset}
          isLoadingAI={isLoadingAIFilter}
        />

        {/* Studio Customizable Speech Audio Filters DSP Rack */}
        <VoiceRack settings={settings} onUpdateSettings={handleUpdateSettings} />
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-3.5 text-center text-xs text-slate-500">
        <p>
          VoiceStudio AI • Studio Giọng Nói &amp; Text-to-Speech Biểu Cảm • 48kHz 32-bit Floating DSP
          Engine
        </p>
      </footer>

      {/* Modals */}
      <AIScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onApplyScript={(script) => {
          setText(script);
          showToast('Đã chèn kịch bản AI vào ô chuyển đổi!');
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportAudio}
        isExporting={isExporting}
        exportProgress={exportProgress}
        durationSeconds={duration}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onApiKeySaved={(key) => {
          const exists = Boolean(key && key.trim().length > 5);
          setHasApiKey(exists);
          if (exists) {
            showToast('Đã lưu và kích hoạt API Key cá nhân thành công!');
          } else {
            showToast('Đã xóa API Key cá nhân khỏi trình duyệt.');
          }
        }}
      />
    </div>
  );
}
