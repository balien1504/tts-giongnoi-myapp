import React, { useState } from 'react';
import { Sparkles, X, Loader2, BookOpen, Check, Wand2 } from 'lucide-react';
import { getStoredApiKey } from '../services/apiKeyStorage';
import { GoogleGenAI } from '@google/genai';

interface AIScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScript: (script: string) => void;
}

export const AIScriptModal: React.FC<AIScriptModalProps> = ({
  isOpen,
  onClose,
  onApplyScript,
}) => {
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState('Podcast');
  const [tone, setTone] = useState('Truyền cảm & Sâu lắng');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [generatedScript, setGeneratedScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    const storedApiKey = getStoredApiKey();
    const prompt = `Bạn là biên tập viên kịch bản lồng tiếng & thu âm giọng đọc chuyên nghiệp tiếng Việt.
Hãy viết một đoạn kịch bản ngắn để đọc thành lời (Text-to-Speech) theo chủ đề: "${topic.trim() || `${genre} - Phong cách ${tone}`}" với phong cách/cảm xúc: "${tone}".
Độ dài: khoảng ${length === 'short' ? '40-70 từ' : length === 'long' ? '180-250 từ' : '90-130 từ'}.
Ngắt nhịp câu rõ ràng, tự nhiên, văn phong truyền cảm, mượt mà khi phát âm tiếng Việt. Chỉ trả về trực tiếp đoạn văn bản đọc, không thêm lời dẫn hay giải thích.`;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedApiKey) {
        headers['x-gemini-api-key'] = storedApiKey;
      }

      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: topic.trim() || `${genre} - Phong cách ${tone}`,
          genre,
          tone,
          length,
          apiKey: storedApiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.script) {
          setGeneratedScript(data.script);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend generate-script failed, checking client fallback:', e);
    }

    // Direct browser fallback using stored API key (useful for GitHub Pages / static hosting)
    if (storedApiKey) {
      try {
        const clientAi = new GoogleGenAI({ apiKey: storedApiKey });
        const response = await clientAi.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        if (response.text) {
          setGeneratedScript(response.text.trim());
          return;
        }
      } catch (clientErr) {
        console.warn('Client-side script generation error:', clientErr);
      }
    }

    // Fallback default sample script if no key or network offline
    setGeneratedScript(
      'Chào mừng bạn đến với không gian âm thanh VoiceStudio AI. Nơi đây, mỗi câu từ đều được truyền tải với trọn vẹn cảm xúc và chiều sâu, mang lại trải nghiệm lắng nghe chân thực và cuốn hút nhất.'
    );
    setIsLoading(false);
  };

  const handleApply = () => {
    if (generatedScript) {
      onApplyScript(generatedScript);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0a0e16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Trợ Lý Viết Kịch Bản Giọng Đọc AI
              </h2>
              <p className="text-xs text-slate-400">
                Tự động sáng tác nội dung đọc tiếng Việt truyền cảm, ngắt nhịp mượt mà
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Thể Loại:</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-400"
              >
                <option value="Podcast">Podcast Tâm Sự / Tản Văn</option>
                <option value="Thời Sự">Bản Tin Thời Sự / Điểm Tin</option>
                <option value="AudioBook">Kể Chuyện / Đọc Sách Đêm</option>
                <option value="Thuyết Minh Phim">Thuyết Minh Phim / Tài Liệu</option>
                <option value="Quảng Cáo">Quảng Cáo / Giới Thiệu Sản Phẩm</option>
                <option value="Thuyết Trình">Diễn Thuyết / Bài Học Cuộc Sống</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Phong Cách / Cảm Xúc:</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-400"
              >
                <option value="Truyền cảm & Sâu lắng">Truyền cảm &amp; Sâu lắng</option>
                <option value="Trang trọng & Dứt khoát">Trang trọng &amp; Dứt khoát</option>
                <option value="Hào hứng & Năng lượng">Hào hứng &amp; Năng lượng</option>
                <option value="Thì thầm & Nhẹ nhàng">Thì thầm &amp; Nhẹ nhàng</option>
                <option value="Kịch tính & Hồi hộp">Kịch tính &amp; Hồi hộp</option>
                <option value="Hùng hồn & Quyền lực">Hùng hồn &amp; Quyền lực</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Chủ Đề Cụ Thể (Tùy chọn):
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Lợi ích của việc dậy sớm, Giới thiệu tai nghe chống ồn, Chuyện đêm muộn..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Độ Dài Mong Muốn:</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'short', label: 'Ngắn (~50 từ)' },
                  { id: 'medium', label: 'Vừa (~120 từ)' },
                  { id: 'long', label: 'Dài (~200 từ)' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLength(item.id)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                    length === item.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>AI Đang Viết Kịch Bản...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Tạo Kịch Bản Mới Bằng AI</span>
              </>
            )}
          </button>

          {/* Generated Result Preview */}
          {generatedScript && (
            <div className="space-y-2 pt-2 animate-in fade-in duration-200">
              <label className="block text-slate-300 font-semibold">
                Nội Dung Kịch Bản Đã Tạo:
              </label>
              <textarea
                value={generatedScript}
                onChange={(e) => setGeneratedScript(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-400 leading-relaxed font-sans"
              />

              <button
                onClick={handleApply}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Dán Vào Khung Chuyển Text-to-Speech</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
