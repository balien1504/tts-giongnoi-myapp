import React, { useState, useMemo } from 'react';
import { TTSVoiceOption } from '../types/audio';
import { ALL_VOICE_PERSONAS, VOICE_CATEGORIES } from '../services/voiceCatalog';
import {
  Users,
  X,
  Search,
  Sparkles,
  Check,
  Play,
  Volume2,
  Sliders,
  Filter,
  UserCheck,
} from 'lucide-react';

interface VoiceCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceId: string;
  onSelectVoice: (voice: TTSVoiceOption) => void;
  onAuditionPhrase?: (phrase: string, voice: TTSVoiceOption) => void;
}

export const VoiceCatalogModal: React.FC<VoiceCatalogModalProps> = ({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelectVoice,
  onAuditionPhrase,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredVoices = useMemo(() => {
    return ALL_VOICE_PERSONAS.filter((voice) => {
      const matchCategory =
        selectedCategory === 'all' || voice.category === selectedCategory;
      const matchGender =
        genderFilter === 'all' || voice.gender === genderFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        voice.name.toLowerCase().includes(query) ||
        voice.accent.toLowerCase().includes(query) ||
        voice.description.toLowerCase().includes(query);
      return matchCategory && matchGender && matchSearch;
    });
  }, [selectedCategory, genderFilter, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (voice: TTSVoiceOption) => {
    onSelectVoice(voice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0a0e16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-sky-500/20 text-emerald-300 border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Tổng Hợp Nhân Vật Giọng Đọc (Voice Personas)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  {ALL_VOICE_PERSONAS.length} Nhân Vật
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thư viện giọng đọc đa dạng: Nam/Nữ, Thời Sự, Kể Chuyện, Podcast, Hoạt Hình &amp; Điện Ảnh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {VOICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Gender Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 'female', label: 'Giọng Nữ' },
                  { id: 'male', label: 'Giọng Nam' },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGenderFilter(g.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    genderFilter === g.id
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nhân vật theo tên, phong cách, phim tài liệu, thời sự..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Voices Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredVoices.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Không tìm thấy nhân vật giọng đọc nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
              {filteredVoices.map((voice) => {
                const isSelected = selectedVoiceId === voice.id;

                return (
                  <div
                    key={voice.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 relative ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-500/15 via-slate-900 to-sky-950/30 border-emerald-500/70 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                        : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Top Row: Name, Gender & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-100">
                            {voice.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase ${
                              voice.gender === 'female'
                                ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {voice.gender === 'female' ? 'Nữ' : 'Nam'}
                          </span>

                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                            {voice.accent}
                          </span>

                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-sky-400 border border-slate-800">
                            Model: {voice.geminiVoice}
                          </span>
                        </div>
                      </div>

                      {/* Select Status Indicator */}
                      {isSelected && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold flex-shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Đang chọn</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {voice.description}
                    </p>

                    {/* Sample Phrase Quote */}
                    {voice.samplePhrase && (
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 italic">
                        &quot;{voice.samplePhrase}&quot;
                      </div>
                    )}

                    {/* Action Row */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                      {onAuditionPhrase && voice.samplePhrase ? (
                        <button
                          onClick={() => onAuditionPhrase(voice.samplePhrase!, voice)}
                          className="flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-900/40 px-2.5 py-1.5 rounded-lg border border-sky-800/40 transition-colors"
                          title="Đưa câu mẫu vào ô văn bản và chọn giọng này"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Thử giọng đọc này</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      <button
                        onClick={() => handleSelect(voice)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã Chọn</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Chọn Giọng Này</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Hỗ trợ bởi mô hình TTS thế hệ mới, nhận diện nhân vật và phong cách cảm xúc đa dạng.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
