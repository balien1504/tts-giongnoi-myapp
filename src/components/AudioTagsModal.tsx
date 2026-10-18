import React, { useState, useMemo } from 'react';
import { AUDIO_TAGS, AUDIO_TAG_CATEGORIES, AudioTagItem } from '../services/audioTags';
import {
  Tag,
  X,
  Search,
  Sparkles,
  Plus,
  Check,
  Copy,
  Info,
  Layers,
  Volume2,
  Clock,
  Heart,
  Smile,
  Zap,
} from 'lucide-react';

interface AudioTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTag: (tag: string, closeTag?: string) => void;
  onUseExample: (example: string) => void;
}

export const AudioTagsModal: React.FC<AudioTagsModalProps> = ({
  isOpen,
  onClose,
  onInsertTag,
  onUseExample,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTagId, setCopiedTagId] = useState<string | null>(null);
  const [insertedTagId, setInsertedTagId] = useState<string | null>(null);

  const filteredTags = useMemo(() => {
    return AUDIO_TAGS.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.tag.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.example.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleInsert = (item: AudioTagItem) => {
    onInsertTag(item.tag, item.closeTag);
    setInsertedTagId(item.id);
    setTimeout(() => setInsertedTagId(null), 1500);
  };

  const handleCopy = (tag: string, id: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTagId(id);
    setTimeout(() => setCopiedTagId(null), 1500);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'burst':
        return <Smile className="w-3.5 h-3.5 text-amber-400" />;
      case 'backchannel':
        return <Volume2 className="w-3.5 h-3.5 text-sky-400" />;
      case 'pacing':
        return <Clock className="w-3.5 h-3.5 text-purple-400" />;
      case 'mood':
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0a0e16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500/20 to-purple-500/20 text-sky-300 border border-sky-500/30">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Tổng Hợp Thẻ Audio Tags (Cảm Xúc &amp; Ngữ Điệu)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  {AUDIO_TAGS.length} Thẻ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Chèn các thẻ biểu cảm, đệm lời, ngắt nghỉ vào văn bản để giọng đọc AI sống động như người thật
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

        {/* Filter Bar & Search */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {AUDIO_TAG_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm thẻ (vd: cười, nghỉ, yeah)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Quick Guidance Info */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-sky-950/20 border border-sky-800/30 px-3 py-1.5 rounded-lg">
            <Info className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            <span>
              <strong>Cách dùng:</strong> Nhấp <strong>&quot;Chèn thẻ&quot;</strong> để thêm trực tiếp vào vị trí con trỏ trong khung văn bản.
            </span>
          </div>
        </div>

        {/* Tags List Container */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredTags.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Không tìm thấy Audio Tag nào phù hợp với từ khóa &quot;{searchQuery}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTags.map((item) => {
                const isInserted = insertedTagId === item.id;
                const isCopied = copiedTagId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-800/90 bg-slate-950/70 hover:border-slate-700 transition-all flex flex-col justify-between gap-2.5 group"
                  >
                    {/* Top Row: Tag token & actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30 selection:bg-sky-500 selection:text-black">
                          {item.isPair ? `${item.tag}...${item.closeTag}` : item.tag}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1">
                          {getCategoryIcon(item.category)}
                          <span>{item.badge}</span>
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(item.tag, item.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition-colors"
                          title="Sao chép thẻ này"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleInsert(item)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                            isInserted
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                          }`}
                        >
                          {isInserted ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã chèn!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Chèn thẻ</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Tag Details */}
                    <div>
                      <h4 className="font-semibold text-xs text-slate-200 mb-0.5">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Real-life Vietnamese Example */}
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-300 font-sans italic line-clamp-2">
                        &quot;{item.example}&quot;
                      </div>
                      <button
                        onClick={() => {
                          onUseExample(item.example);
                          onClose();
                        }}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-medium whitespace-nowrap bg-purple-950/40 hover:bg-purple-900/50 px-2 py-1 rounded border border-purple-800/50 transition-colors"
                        title="Dán trọn vẹn câu mẫu này vào khung soạn thảo"
                      >
                        Dùng câu này
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
            Hỗ trợ bởi mô hình TTS thế hệ mới nhận diện biểu cảm thanh âm tự nhiên.
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
