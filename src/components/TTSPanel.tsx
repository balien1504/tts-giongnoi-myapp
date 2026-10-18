import React, { useState, useRef } from 'react';
import {
  VoiceEmotionId,
  VoiceEmotion,
  TTSVoiceOption,
  SampleTextItem,
  VoiceFilterSettings,
} from '../types/audio';
import { VOICE_EMOTIONS, TTS_VOICES, SAMPLE_TEXTS } from '../services/voicePresets';
import { AUDIO_TAGS } from '../services/audioTags';
import { ALL_VOICE_PERSONAS } from '../services/voiceCatalog';
import { AudioTagsModal } from './AudioTagsModal';
import { VoiceCatalogModal } from './VoiceCatalogModal';
import {
  Sparkles,
  Volume2,
  Play,
  RotateCcw,
  BookOpen,
  MessageSquare,
  Wand2,
  Loader2,
  Check,
  ChevronDown,
  Info,
  Sliders,
  Heart,
  Radio,
  Smile,
  Feather,
  Film,
  Zap,
  CloudRain,
  PartyPopper,
  Tag,
  Plus,
  Users,
  Key,
  AlertCircle,
} from 'lucide-react';

interface TTSPanelProps {
  text: string;
  onChangeText: (val: string) => void;
  selectedEmotionId: VoiceEmotionId;
  onSelectEmotion: (emotionId: VoiceEmotionId) => void;
  selectedVoice: TTSVoiceOption;
  onSelectVoice: (voice: TTSVoiceOption) => void;
  customStyle: string;
  onChangeCustomStyle: (val: string) => void;
  onGenerateSpeech: () => Promise<void>;
  isGenerating: boolean;
  hasAudio: boolean;
  onPlayCurrent: () => void;
  isPlaying: boolean;
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
}

// Icon mapping helper
const getEmotionIcon = (iconName: string) => {
  switch (iconName) {
    case 'Heart':
      return <Heart className="w-4 h-4" />;
    case 'Radio':
      return <Radio className="w-4 h-4" />;
    case 'Sparkles':
      return <Sparkles className="w-4 h-4" />;
    case 'Smile':
      return <Smile className="w-4 h-4" />;
    case 'Feather':
      return <Feather className="w-4 h-4" />;
    case 'Film':
      return <Film className="w-4 h-4" />;
    case 'Zap':
      return <Zap className="w-4 h-4" />;
    case 'CloudRain':
      return <CloudRain className="w-4 h-4" />;
    case 'PartyPopper':
      return <PartyPopper className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
  }
};

// Popular quick tags to display above the editor
const QUICK_TAGS = [
  { tag: '<laugh>', label: 'Cười tươi', color: 'hover:border-amber-400 text-amber-300' },
  { tag: '<chuckle>', label: 'Cười mỉm', color: 'hover:border-amber-400 text-amber-300' },
  { tag: '<gasp>', label: 'Kinh ngạc', color: 'hover:border-rose-400 text-rose-300' },
  { tag: '<sigh>', label: 'Thở dài', color: 'hover:border-cyan-400 text-cyan-300' },
  { tag: '<breath>', label: 'Lấy hơi', color: 'hover:border-emerald-400 text-emerald-300' },
  {
    tag: '<whisper>',
    closeTag: '</whisper>',
    label: 'Thì thầm',
    color: 'hover:border-purple-400 text-purple-300',
  },
  { tag: '|yeah|', label: '|yeah|', color: 'hover:border-sky-400 text-sky-300' },
  { tag: '|mhm|', label: '|mhm|', color: 'hover:border-sky-400 text-sky-300' },
  { tag: '[nghỉ 1.0s]', label: 'Nghỉ 1.0s', color: 'hover:border-indigo-400 text-indigo-300' },
  {
    tag: '[nhấn mạnh]',
    closeTag: '[/nhấn mạnh]',
    label: 'Nhấn mạnh',
    color: 'hover:border-orange-400 text-orange-300',
  },
];

export const TTSPanel: React.FC<TTSPanelProps> = ({
  text,
  onChangeText,
  selectedEmotionId,
  onSelectEmotion,
  selectedVoice,
  onSelectVoice,
  customStyle,
  onChangeCustomStyle,
  onGenerateSpeech,
  isGenerating,
  hasAudio,
  onPlayCurrent,
  isPlaying,
  hasApiKey,
  onOpenApiKeyModal,
}) => {
  const [showSampleDropdown, setShowSampleDropdown] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [isAudioTagsModalOpen, setIsAudioTagsModalOpen] = useState(false);
  const [isVoiceCatalogOpen, setIsVoiceCatalogOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Word & character stats
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedReadTimeSecs = Math.max(1, Math.round(wordCount / 2.7));

  const activeEmotion =
    VOICE_EMOTIONS.find((e) => e.id === selectedEmotionId) || VOICE_EMOTIONS[0];

  const handleSelectSample = (sample: SampleTextItem) => {
    onChangeText(sample.text);
    onSelectEmotion(sample.emotionId);
    setShowSampleDropdown(false);
  };

  /**
   * Insert an Audio Tag at the current cursor position or wrap selection
   */
  const handleInsertTag = (tag: string, closeTag?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChangeText(text + (text ? ' ' : '') + (closeTag ? `${tag}${closeTag}` : tag));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);

    let replacement = '';
    let newCursorPos = start + tag.length;

    if (closeTag) {
      if (selectedText) {
        replacement = `${tag}${selectedText}${closeTag}`;
        newCursorPos = start + replacement.length;
      } else {
        replacement = `${tag}${closeTag}`;
        newCursorPos = start + tag.length;
      }
    } else {
      // Add leading space if needed
      const needsLeadingSpace = start > 0 && text[start - 1] !== ' ' && text[start - 1] !== '\n';
      const needsTrailingSpace = end < text.length && text[end] !== ' ' && text[end] !== '\n';

      replacement = (needsLeadingSpace ? ' ' : '') + tag + (needsTrailingSpace ? ' ' : '');
      newCursorPos = start + replacement.length;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    onChangeText(newText);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl space-y-5">
      {/* Top Bar: Title & Sample Texts */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Chuyển Văn Bản Thành Giọng Nói (Text-to-Speech)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 font-normal">
                Biểu Cảm AI
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Nhập nội dung, chèn Audio Tags biểu cảm và tạo giọng đọc tự nhiên như người thật
            </p>
          </div>
        </div>

        {/* Quick Sample Scripts */}
        <div className="relative">
          <button
            onClick={() => setShowSampleDropdown(!showSampleDropdown)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/60 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Mẫu Kịch Bản Có Sẵn</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showSampleDropdown && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl p-2 z-40 backdrop-blur-xl animate-in fade-in duration-150">
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Chọn kịch bản mẫu
              </div>
              <div className="space-y-1">
                {SAMPLE_TEXTS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors text-xs text-slate-300 flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200 truncate pr-1">
                        {sample.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 font-mono flex-shrink-0">
                        {sample.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{sample.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AUDIO TAGS TOOLBAR (Thẻ cảm xúc & ngữ điệu) */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
              Thẻ Audio Tags (Cảm Xúc &amp; Ngữ Điệu)
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
              Chèn nhanh
            </span>
          </div>

          {/* Full Tags Library Modal Button */}
          <button
            onClick={() => setIsAudioTagsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-500/20 to-purple-500/20 hover:from-sky-500/30 hover:to-purple-500/30 text-sky-200 border border-sky-500/40 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Xem Tổng Hợp Audio Tags ({AUDIO_TAGS.length}+ Thẻ)</span>
          </button>
        </div>

        {/* Quick Tags Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_TAGS.map((item) => (
            <button
              key={item.tag}
              onClick={() => handleInsertTag(item.tag, item.closeTag)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all ${item.color}`}
              title={`Chèn thẻ ${item.tag} vào nội dung`}
            >
              <Plus className="w-3 h-3 text-slate-500" />
              <span>{item.tag}</span>
              <span className="text-[10px] text-slate-500 font-sans font-normal ml-0.5">
                ({item.label})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Text Input Area */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            rows={5}
            placeholder="Nhập nội dung văn bản tiếng Việt... Bạn có thể chèn các Audio Tags như <laugh>, <breath>, |yeah|, [nghỉ 1.0s] trực tiếp vào câu để tạo ngữ điệu và âm thanh cảm xúc tự nhiên!"
            className="w-full bg-slate-950/90 border border-slate-800 focus:border-sky-500 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all resize-y min-h-[120px] leading-relaxed selection:bg-sky-500 selection:text-black font-sans"
          />

          {/* Quick Clear Button */}
          {text && (
            <button
              onClick={() => onChangeText('')}
              className="absolute top-3 right-3 text-xs text-slate-500 hover:text-slate-300 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800 transition-colors"
              title="Xóa nội dung"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Text Area Footer Stats */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono px-1">
          <div className="flex items-center gap-3">
            <span>{charCount} ký tự</span>
            <span>•</span>
            <span>{wordCount} từ</span>
            <span>•</span>
            <span>Ước tính: ~{estimatedReadTimeSecs} giây</span>
          </div>

          <button
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            className="text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            <Sliders className="w-3 h-3" />
            <span>{showCustomPrompt ? 'Ẩn chỉ dẫn chi tiết' : '+ Thêm chỉ dẫn ngữ điệu sâu'}</span>
          </button>
        </div>

        {/* Optional Custom Style Prompt */}
        {showCustomPrompt && (
          <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-xl space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium">
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Chỉ dẫn ngữ điệu &amp; tốc độ tùy biến (AI Style Guidance):</span>
            </div>
            <input
              type="text"
              value={customStyle}
              onChange={(e) => onChangeCustomStyle(e.target.value)}
              placeholder="Ví dụ: Đọc nhấn nhá ở các từ khóa, ngắt nghỉ 1 giây sau câu hỏi, giọng ấm áp và lắng đọng..."
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
            />
          </div>
        )}
      </div>

      {/* SECTION 1: Chọn Trạng Thái Biểu Cảm */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Chọn Trạng Thái Biểu Cảm (Emotional Tone)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Đang chọn:{' '}
            <strong className="text-sky-300 font-semibold">{activeEmotion.name}</strong>
          </span>
        </div>

        {/* Grid of Emotions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
          {VOICE_EMOTIONS.map((emotion) => {
            const isSelected = selectedEmotionId === emotion.id;
            return (
              <button
                key={emotion.id}
                onClick={() => onSelectEmotion(emotion.id)}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-sky-500/20 via-indigo-500/20 to-purple-500/20 border-sky-400 shadow-lg shadow-sky-500/15 ring-1 ring-sky-400'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`p-1.5 rounded-lg border flex items-center justify-center ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {getEmotionIcon(emotion.icon)}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                </div>

                <div>
                  <h4
                    className={`font-semibold text-xs leading-tight ${
                      isSelected ? 'text-white' : 'text-slate-200'
                    }`}
                  >
                    {emotion.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {emotion.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Chọn Nhân Vật Giọng Đọc (Voice Persona) */}
      <div className="space-y-2.5 pt-1 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Chọn Nhân Vật Giọng Đọc (Voice Persona)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              {selectedVoice.gender === 'female' ? 'Nữ' : 'Nam'} • Model: {selectedVoice.geminiVoice}
            </span>

            {/* Full Voice Catalog Modal Button */}
            <button
              onClick={() => setIsVoiceCatalogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 transition-all shadow-sm"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xem Tổng Hợp Giọng Nhân Vật ({ALL_VOICE_PERSONAS.length}+ Giọng)</span>
            </button>
          </div>
        </div>

        {/* Quick Voice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {(() => {
            // Include currently selected voice at front if it's from the expanded catalog
            const isCustomSelected = !TTS_VOICES.some((v) => v.id === selectedVoice.id);
            const displayVoices = isCustomSelected ? [selectedVoice, ...TTS_VOICES] : TTS_VOICES;

            return displayVoices.map((voice) => {
              const isSelected = selectedVoice.id === voice.id;
              return (
                <button
                  key={voice.id}
                  onClick={() => onSelectVoice(voice)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-100 truncate pr-1">
                      {voice.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold flex-shrink-0 ${
                        voice.gender === 'female'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {voice.gender === 'female' ? 'Nữ' : 'Nam'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{voice.description}</p>
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Missing API Key Warning Callout */}
      {!hasApiKey && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 text-amber-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-xs text-amber-300">
                Chưa có Google Gemini API Key cá nhân
              </p>
              <p className="text-[11px] text-slate-400">
                Nhập API Key trực tiếp vào trình duyệt để kích hoạt tạo giọng nói AI biểu cảm khi sử dụng hoặc chia sẻ online.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-md shrink-0 flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Nhập API Key Ngay</span>
          </button>
        </div>
      )}

      {/* Action Footer: Generate Speech Button & Direct Playback */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {hasAudio && (
            <button
              onClick={onPlayCurrent}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                isPlaying
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md'
                  : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isPlaying ? 'animate-pulse' : ''}`} />
              <span>{isPlaying ? 'Đang Nghe Giọng...' : 'Nghe Lại Bản Thu'}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Âm thanh sau khi tạo sẽ tự động đưa vào dàn lọc DSP</span>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerateSpeech}
          disabled={isGenerating || !text.trim()}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:via-indigo-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xl shadow-sky-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Đang Chuyển Đổi Text Sang Giọng Nói...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Tạo Giọng Nói Biểu Cảm Ngay</span>
            </>
          )}
        </button>
      </div>

      {/* Audio Tags Modal */}
      <AudioTagsModal
        isOpen={isAudioTagsModalOpen}
        onClose={() => setIsAudioTagsModalOpen(false)}
        onInsertTag={(tag, closeTag) => handleInsertTag(tag, closeTag)}
        onUseExample={(example) => onChangeText(example)}
      />

      {/* Voice Catalog Modal */}
      <VoiceCatalogModal
        isOpen={isVoiceCatalogOpen}
        onClose={() => setIsVoiceCatalogOpen(false)}
        selectedVoiceId={selectedVoice.id}
        onSelectVoice={(voice) => onSelectVoice(voice)}
        onAuditionPhrase={(phrase, voice) => {
          onChangeText(phrase);
          onSelectVoice(voice);
        }}
      />
    </div>
  );
};
